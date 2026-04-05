import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_kavach/models/app_data.dart';
import 'package:flutter_kavach/providers/app_provider.dart';
import 'package:flutter_kavach/services/app_data_cache.dart';
import 'package:flutter_kavach/services/kavach_api_client.dart';

class FakeKavachApiClient implements KavachApiClient {
  FakeKavachApiClient({
    this.loginResponse,
    this.appData,
    this.loginError,
    this.appDataError,
  });

  final AuthSession? loginResponse;
  final Map<String, dynamic>? appData;
  final KavachApiException? loginError;
  final KavachApiException? appDataError;

  String? loginPhone;
  String? loginOtp;
  bool demoLoginCalled = false;
  bool restoreSessionCalled = false;
  bool loadAppDataCalled = false;

  @override
  Future<AuthSession?> restoreSession() async {
    restoreSessionCalled = true;
    return loginResponse;
  }

  @override
  Future<AuthSession> loginWithPhone(String phone, {String? otp}) async {
    loginPhone = phone;
    loginOtp = otp;
    if (loginError != null) {
      throw loginError!;
    }
    final response = loginResponse;
    if (response == null) {
      throw StateError('loginResponse must be set for this test');
    }
    return response;
  }

  @override
  Future<AuthSession> demoLogin() async {
    demoLoginCalled = true;
    if (loginError != null) {
      throw loginError!;
    }
    final response = loginResponse;
    if (response == null) {
      throw StateError('loginResponse must be set for this test');
    }
    return response;
  }

  @override
  Future<Map<String, dynamic>> fetchAppData() async {
    loadAppDataCalled = true;
    if (appDataError != null) {
      throw appDataError!;
    }
    final response = appData;
    if (response == null) {
      throw StateError('appData must be set for this test');
    }
    return response;
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> clearSession() async {}

  @override
  Future<SupportTicket> requestEmergencySupport({String channel = 'callback'}) async {
    return const SupportTicket(
      ticketId: 'support-1',
      status: 'queued',
      message: 'queued',
    );
  }
}

class InMemoryAppDataCacheStore implements AppDataCacheStore {
  Map<String, dynamic>? _appData;
  List<Map<String, dynamic>> _supportTickets = const [];

  @override
  Future<void> clear() async {
    _appData = null;
    _supportTickets = const [];
  }

  @override
  Future<Map<String, dynamic>?> loadAppData() async => _appData;

  @override
  Future<List<Map<String, dynamic>>> loadSupportTicketHistory() async => _supportTickets;

  @override
  Future<void> saveAppData(Map<String, dynamic> data) async {
    _appData = Map<String, dynamic>.from(data);
  }

  @override
  Future<void> saveSupportTicketHistory(List<Map<String, dynamic>> tickets) async {
    _supportTickets = tickets.map((ticket) => Map<String, dynamic>.from(ticket)).toList(growable: false);
  }
}

void main() {
  test('logs in returning worker by phone and loads app data without demo fallback', () async {
    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginResponse: const AuthSession(
          token: 'token-123',
          user: {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        ),
        appData: {
          'user': {
            'name': 'Meera Jain',
            'platform': 'Swiggy',
            'plan': 'Standard',
            'zone': 'Koramangala',
            'trustScore': 88,
            'iwi': 5400,
          },
          'dashboard': {
            'riskOutlook': {
              'level': 'moderate',
              'summary': 'Weather risk is rising',
              'nextLikelyTrigger': 'Heavy rain',
              'premiumDelta': 12,
              'protectedAmount': 7600,
              'coverageHours': 18,
              'confidence': 74,
            },
            'payoutState': {
              'reference': 'pay_123',
              'amount': 571,
              'status': 'paid',
              'provider': 'upi_mock',
              'rail': 'UPI',
              'etaMinutes': 0,
              'updatedAt': '2026-04-05T07:00:00Z',
            },
            'fraudAssessment': {
              'score': 13,
              'status': 'clear',
              'summary': 'Signals look consistent',
              'signals': const [],
            },
            'triggerEvaluations': const [],
            'quickActions': const [],
          },
          'claims': {
            'payoutHistory': const [],
            'premiumHistory': const [],
            'payoutState': {
              'reference': 'pay_123',
              'amount': 571,
              'status': 'paid',
              'provider': 'upi_mock',
              'rail': 'UPI',
              'etaMinutes': 0,
              'updatedAt': '2026-04-05T07:00:00Z',
            },
            'fraudAssessment': {
              'score': 13,
              'status': 'clear',
              'summary': 'Signals look consistent',
              'signals': const [],
            },
          },
          'policy': {
            'coverage': const [],
            'triggers': const [],
            'premiumHistory': const [],
            'dynamicPremium': {
              'level': 'moderate',
              'summary': 'Premium is temporarily elevated',
              'nextLikelyTrigger': 'More rain expected tonight',
              'premiumDelta': 12,
              'protectedAmount': 7600,
              'coverageHours': 18,
              'confidence': 74,
            },
          },
          'alerts': {
            'feed': const [],
            'emergencyResources': const [],
            'supportContacts': const [],
          },
          'profile': {
            'documents': const [],
            'settings': const [],
            'monthlyProtectedAmount': 24000,
          },
        },
      ),
    );

    await provider.loginWithPhone('+91 9988776655');

    expect(provider.authState, AppAuthState.authenticated);
    expect(provider.dataState, AppDataState.ready);
    expect(provider.errorMessage, isNull);
    expect(provider.appData?.userName, 'Meera Jain');
    expect(provider.appData?.riskOutlook.premiumDelta, 12);
    expect(provider.appData?.payoutState.reference, 'pay_123');
  });

  test('surfaces login failures and stays signed out', () async {
    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginError: const KavachApiException(
          message: 'No Kavach account was found for that phone number.',
          statusCode: 404,
          code: 'user_not_found',
        ),
      ),
    );

    await provider.loginWithPhone('999');

    expect(provider.authState, AppAuthState.signedOut);
    expect(provider.dataState, AppDataState.idle);
    expect(provider.appData, isNull);
    expect(provider.errorMessage, contains('No Kavach account'));
  });

  test('keeps authenticated state but exposes data load failures without mock data', () async {
    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginResponse: const AuthSession(
          token: 'token-123',
          user: {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        ),
        appDataError: const KavachApiException(
          message: 'Failed to load app data: 503',
          statusCode: 503,
          code: 'service_unavailable',
        ),
      ),
    );

    await provider.loginWithPhone('+91 9988776655');

    expect(provider.authState, AppAuthState.authenticated);
    expect(provider.dataState, AppDataState.error);
    expect(provider.isAuthenticated, isTrue);
    expect(provider.appData, isNull);
    expect(provider.errorMessage, contains('Failed to load app data'));
  });

  test('restores cached worker data and keeps it visible when the refresh fails', () async {
    final cacheStore = InMemoryAppDataCacheStore();
    await cacheStore.saveAppData(
      AppData.fromJson({
        'user': {
          'name': 'Meera Jain',
          'platform': 'Swiggy',
          'plan': 'Standard',
          'zone': 'Koramangala',
          'trustScore': 88,
          'iwi': 5400,
        },
        'dashboard': {
          'coverageStatus': 'active',
          'kpis': const [],
          'riskOutlook': {
            'level': 'moderate',
            'summary': 'Weather risk is rising',
            'nextLikelyTrigger': 'Heavy rain',
            'premiumDelta': 12,
            'protectedAmount': 7600,
            'coverageHours': 18,
            'confidence': 74,
          },
          'payoutState': {
            'reference': 'pay_123',
            'amount': 571,
            'status': 'paid',
            'provider': 'upi_mock',
            'rail': 'UPI',
            'etaMinutes': 0,
            'updatedAt': '2026-04-05T07:00:00Z',
          },
          'fraudAssessment': {
            'score': 13,
            'status': 'clear',
            'summary': 'Signals look consistent',
            'signals': const [],
          },
          'triggerEvaluations': const [],
          'quickActions': const [],
        },
        'claims': {
          'payoutHistory': const [],
          'premiumHistory': const [],
          'verificationSignals': const [],
          'fraudAssessment': {
            'score': 13,
            'status': 'clear',
            'summary': 'Signals look consistent',
            'signals': const [],
          },
        },
        'policy': {
          'coverage': const [],
          'triggers': const [],
          'dynamicPremium': {
            'level': 'moderate',
            'summary': 'Premium is temporarily elevated',
            'nextLikelyTrigger': 'More rain expected tonight',
            'premiumDelta': 12,
            'protectedAmount': 7600,
            'coverageHours': 18,
            'confidence': 74,
          },
        },
        'alerts': {
          'feed': const [],
          'emergencyResources': const [],
          'supportContacts': const [],
        },
        'profile': {
          'documents': const [],
          'settings': const [],
          'monthlyProtectedAmount': 24000,
        },
      }).toJson(),
    );

    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginResponse: const AuthSession(
          token: 'token-123',
          user: {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        ),
        appDataError: const KavachApiException(
          message: 'Failed to load app data: 503',
          statusCode: 503,
          code: 'service_unavailable',
        ),
      ),
      cacheStore: cacheStore,
    );

    await provider.restoreSession();

    expect(provider.authState, AppAuthState.authenticated);
    expect(provider.dataState, AppDataState.error);
    expect(provider.appData, isNotNull);
    expect(provider.hasStaleData, isTrue);
    expect(provider.appData?.userName, 'Meera Jain');
    expect(provider.errorMessage, contains('Failed to load app data'));
  });

  test('persists support ticket history locally for later review', () async {
    final cacheStore = InMemoryAppDataCacheStore();
    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginResponse: const AuthSession(
          token: 'token-123',
          user: {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        ),
        appData: {
          'user': {
            'name': 'Meera Jain',
            'platform': 'Swiggy',
            'plan': 'Standard',
            'zone': 'Koramangala',
            'trustScore': 88,
            'iwi': 5400,
          },
          'dashboard': {
            'coverageStatus': 'active',
            'kpis': const [],
            'riskOutlook': {
              'level': 'moderate',
              'summary': 'Weather risk is rising',
              'nextLikelyTrigger': 'Heavy rain',
              'premiumDelta': 12,
              'protectedAmount': 7600,
              'coverageHours': 18,
              'confidence': 74,
            },
            'payoutState': {
              'reference': 'pay_123',
              'amount': 571,
              'status': 'paid',
              'provider': 'upi_mock',
              'rail': 'UPI',
              'etaMinutes': 0,
              'updatedAt': '2026-04-05T07:00:00Z',
            },
            'fraudAssessment': {
              'score': 13,
              'status': 'clear',
              'summary': 'Signals look consistent',
              'signals': const [],
            },
            'triggerEvaluations': const [],
            'quickActions': const [],
          },
          'claims': {
            'payoutHistory': const [],
            'premiumHistory': const [],
            'verificationSignals': const [],
            'fraudAssessment': {
              'score': 13,
              'status': 'clear',
              'summary': 'Signals look consistent',
              'signals': const [],
            },
          },
          'policy': {
            'coverage': const [],
            'triggers': const [],
            'dynamicPremium': {
              'level': 'moderate',
              'summary': 'Premium is temporarily elevated',
              'nextLikelyTrigger': 'More rain expected tonight',
              'premiumDelta': 12,
              'protectedAmount': 7600,
              'coverageHours': 18,
              'confidence': 74,
            },
          },
          'alerts': {
            'feed': const [],
            'emergencyResources': const [],
            'supportContacts': const [],
          },
          'profile': {
            'documents': const [],
            'settings': const [],
            'monthlyProtectedAmount': 24000,
          },
        },
      ),
      cacheStore: cacheStore,
    );

    await provider.restoreSession();
    final ticket = await provider.requestEmergencySupport(channel: 'callback');

    expect(ticket, isNotNull);
    expect(provider.supportTicketHistory, hasLength(1));
    expect(provider.latestSupportTicket?.ticketId, 'support-1');

    final reloaded = AppProvider(
      apiClient: FakeKavachApiClient(
        loginResponse: const AuthSession(
          token: 'token-123',
          user: {
            'id': 'worker-1',
            'name': 'Meera Jain',
            'phone': '+91 9988776655',
            'role': 'worker',
          },
        ),
        appData: provider.appData?.toJson(),
      ),
      cacheStore: cacheStore,
    );

    await reloaded.restoreSession();

    expect(reloaded.supportTicketHistory, hasLength(1));
    expect(reloaded.supportTicketHistory.first.ticket.ticketId, 'support-1');
  });

  test('switches to otp stage when the backend asks for verification', () async {
    final provider = AppProvider(
      apiClient: FakeKavachApiClient(
        loginError: const KavachApiException(
          message: 'OTP verification required.',
          statusCode: 202,
          code: 'otp_required',
        ),
      ),
    );

    await provider.loginWithPhone('+91 9988776655');

    expect(provider.authState, AppAuthState.signedOut);
    expect(provider.loginStage, AppLoginStage.otp);
    expect(provider.pendingPhoneNumber, '+91 9988776655');
    expect(provider.errorMessage, contains('OTP verification required'));
  });
}
