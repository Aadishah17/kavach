import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_data.dart';

export '../models/app_data.dart' show AuthSession, LoginPayload, SupportTicket;

const _defaultBaseUrl = String.fromEnvironment(
  'KAVACH_API_BASE_URL',
  defaultValue: 'https://kavach-kappa-ten.vercel.app/api',
);

abstract interface class KavachApiClient {
  Future<AuthSession?> restoreSession();
  Future<AuthSession> loginWithPhone(String phone, {String? otp});
  Future<AuthSession> demoLogin();
  Future<Map<String, dynamic>> fetchAppData();
  Future<SupportTicket> requestEmergencySupport({String channel});
  Future<void> logout();
  Future<void> clearSession();
}

class KavachApiException implements Exception {
  const KavachApiException({
    required this.message,
    this.statusCode,
    this.code,
  });

  final String message;
  final int? statusCode;
  final String? code;

  @override
  String toString() => message;
}

class HttpKavachApiClient implements KavachApiClient {
  HttpKavachApiClient({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = (baseUrl ?? _defaultBaseUrl).replaceFirst(RegExp(r'/$'), ''),
        _client = client ?? http.Client();

  static const String _tokenKey = 'kavach_session_token';

  final String baseUrl;
  final http.Client _client;

  @override
  Future<AuthSession?> restoreSession() async {
    final token = await _getSavedToken();
    if (token == null) {
      return null;
    }

    final response = await _client.get(
      Uri.parse('$baseUrl/auth/session'),
      headers: await _headers(includeAuth: true),
    );

    if (response.statusCode == 200) {
      return AuthSession.fromJson(_decodeJson(response.body));
    }

    if (response.statusCode == 401) {
      await _clearToken();
      return null;
    }

    throw _apiException(response, fallbackMessage: 'Failed to restore session.');
  }

  @override
  Future<AuthSession> loginWithPhone(String phone, {String? otp}) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: await _headers(),
      body: jsonEncode(LoginPayload(phone: phone, otp: otp).toJson()),
    );

    final session = await _requireSession(response, fallbackMessage: 'Unable to log in with phone.');
    await _saveToken(session.token);
    return session;
  }

  @override
  Future<AuthSession> demoLogin() async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/demo'),
      headers: await _headers(),
    );

    final session = await _requireSession(response, fallbackMessage: 'Unable to start the demo session.');
    await _saveToken(session.token);
    return session;
  }

  @override
  Future<Map<String, dynamic>> fetchAppData() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/app-data'),
      headers: await _headers(includeAuth: true),
    );

    if (response.statusCode == 200) {
      return _decodeJson(response.body);
    }

    if (response.statusCode == 401) {
      await _clearToken();
      throw const KavachApiException(
        message: 'Session expired. Please log in again.',
        statusCode: 401,
        code: 'unauthorized',
      );
    }

    throw _apiException(response, fallbackMessage: 'Failed to load app data: ${response.statusCode}');
  }

  @override
  Future<SupportTicket> requestEmergencySupport({String channel = 'callback'}) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/support/emergency'),
      headers: await _headers(includeAuth: true),
      body: jsonEncode({'channel': channel}),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return SupportTicket.fromJson(_decodeJson(response.body));
    }

    throw _apiException(response, fallbackMessage: 'Unable to request emergency support.');
  }

  @override
  Future<void> logout() async {
    try {
      await _client.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: await _headers(includeAuth: true),
      );
    } finally {
      await _clearToken();
    }
  }

  @override
  Future<void> clearSession() async {
    await _clearToken();
  }

  Future<AuthSession> _requireSession(http.Response response, {required String fallbackMessage}) async {
    if (response.statusCode == 202) {
      final payload = response.body.isNotEmpty ? _decodeJson(response.body) : const <String, dynamic>{};
      throw KavachApiException(
        message: _errorText(payload['message'], _errorText(payload['error'], 'OTP verification required.')),
        statusCode: 202,
        code: _errorText(payload['code'], 'otp_required'),
      );
    }

    if (response.statusCode == 200 || response.statusCode == 201) {
      return AuthSession.fromJson(_decodeJson(response.body));
    }

    throw _apiException(response, fallbackMessage: fallbackMessage);
  }

  Future<Map<String, String>> _headers({bool includeAuth = false}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache', // Allow proxy caching depending on endpoint, but prefer fresh data if mutating
    };

    if (includeAuth) {
      final token = await _getSavedToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
        headers['X-Session-Token'] = token;
      }
    }

    return headers;
  }

  Future<String?> _getSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Map<String, dynamic> _decodeJson(String body) {
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    if (decoded is Map) {
      return decoded.map((key, value) => MapEntry(key.toString(), value));
    }

    return const {};
  }

  String _errorText(dynamic value, [String fallback = '']) {
    final text = value?.toString();
    if (text == null || text.isEmpty) {
      return fallback;
    }
    return text;
  }

  KavachApiException _apiException(http.Response response, {required String fallbackMessage}) {
    final payload = response.body.isNotEmpty ? _decodeJson(response.body) : const <String, dynamic>{};
    final error = payload['error'];

    if (error is Map) {
      return KavachApiException(
        message: (error['message'] ?? fallbackMessage).toString(),
        statusCode: response.statusCode,
        code: error['code']?.toString(),
      );
    }

    return KavachApiException(
      message: fallbackMessage,
      statusCode: response.statusCode,
    );
  }
}
