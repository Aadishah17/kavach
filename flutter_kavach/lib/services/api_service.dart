import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _tokenKey = 'kavach_session_token';
  static const String _configuredBaseUrl = String.fromEnvironment(
    'KAVACH_API_BASE_URL',
    defaultValue: 'https://kavach-kappa-ten.vercel.app/api',
  );

  // Override with --dart-define=KAVACH_API_BASE_URL=... for local development.
  static String get baseUrl => _configuredBaseUrl;

  static Future<String?> getSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getSavedToken();
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['X-Session-Token'] = token;
    }
    return headers;
  }

  /// Demo login — calls POST /api/auth/demo
  /// Returns the full auth response {token, user} or throws.
  static Future<Map<String, dynamic>> demoLogin() async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/demo'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body) as Map<String, dynamic>;
      final token = data['token'] as String?;
      if (token != null) {
        await _saveToken(token);
      }
      return data;
    } else {
      throw Exception('Demo login failed: ${response.statusCode}');
    }
  }

  /// Signup — calls POST /api/auth/signup
  static Future<Map<String, dynamic>> signup({
    required String name,
    required String phone,
    required String platform,
    String plan = 'Kavach Standard',
    String zone = 'Koramangala',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'name': name,
        'phone': phone,
        'platform': platform,
        'plan': plan,
        'zone': zone,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body) as Map<String, dynamic>;
      final token = data['token'] as String?;
      if (token != null) {
        await _saveToken(token);
      }
      return data;
    } else {
      throw Exception('Signup failed: ${response.statusCode}');
    }
  }

  /// Restore session — calls GET /api/auth/session with saved token
  static Future<Map<String, dynamic>?> restoreSession() async {
    final token = await getSavedToken();
    if (token == null) return null;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/session'),
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        await clearToken();
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  /// Get full app data — calls GET /api/app-data (authenticated)
  static Future<Map<String, dynamic>> getAppData() async {
    final response = await http.get(
      Uri.parse('$baseUrl/app-data'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 401) {
      await clearToken();
      throw Exception('Session expired. Please login again.');
    } else {
      throw Exception('Failed to load app data: ${response.statusCode}');
    }
  }

  /// Logout — calls POST /api/auth/logout
  static Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: await _getHeaders(),
      );
    } catch (_) {
      // Best effort
    }
    await clearToken();
  }
}
