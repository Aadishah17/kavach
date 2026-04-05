import 'kavach_api_client.dart';

class ApiService {
  static const String _configuredBaseUrl = String.fromEnvironment(
    'KAVACH_API_BASE_URL',
    defaultValue: 'https://kavach-kappa-ten.vercel.app/api',
  );

  static String get baseUrl => _configuredBaseUrl;

  static HttpKavachApiClient createClient() {
    return HttpKavachApiClient(baseUrl: baseUrl);
  }
}
