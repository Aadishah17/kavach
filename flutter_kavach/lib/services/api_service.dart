import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io' show Platform;

class ApiService {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator / web
  static String get baseUrl {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8787/api';
      }
    } catch (e) {
      // Ignore for web
    }
    return 'http://localhost:8787/api';
  }

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> getAppData() async {
    final response = await http.get(
      Uri.parse('$baseUrl/app-data'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load app data: ${response.statusCode}');
    }
  }

  static Future<bool> sendOtp(String phone) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'phone': phone}),
    );
    return response.statusCode == 200;
  }

  static Future<String?> verifyOtp(String phone, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'phone': phone, 'otp': otp}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token']);
        return data['token'];
      }
    }
    return null;
  }
}
