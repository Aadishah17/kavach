import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_kavach/services/api_service.dart';

void main() {
  test('defaults the app API base URL to the live Vercel deployment', () {
    expect(
      ApiService.baseUrl,
      'https://kavach-kappa-ten.vercel.app/api',
    );
  });
}
