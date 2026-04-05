import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_kavach/services/kavach_api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  test('loginWithPhone posts the phone number to the login endpoint', () async {
    final client = MockClient((request) async {
      expect(request.method, 'POST');
      expect(request.url.path, '/api/auth/login');

      final body = jsonDecode(request.body) as Map<String, dynamic>;
      expect(body['phone'], '+91 9988776655');

      return http.Response(
        jsonEncode({
          'token': 'token-123',
          'user': {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        }),
        201,
      );
    });

    final api = HttpKavachApiClient(
      baseUrl: 'https://example.com/api',
      client: client,
    );

    final session = await api.loginWithPhone('+91 9988776655');

    expect(session.token, 'token-123');
    expect(session.user['name'], 'Meera Jain');
  });
}
