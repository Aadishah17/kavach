import 'package:flutter/foundation.dart';

import '../models/app_data.dart';
import '../services/app_data_cache.dart';
import '../services/kavach_api_client.dart';

enum AppAuthState {
  booting,
  signedOut,
  authenticating,
  authenticated,
}

enum AppDataState {
  idle,
  loading,
  ready,
  error,
}

enum AppLoginStage {
  phone,
  otp,
}

class AppProvider extends ChangeNotifier {
  AppProvider({
    KavachApiClient? apiClient,
    AppDataCacheStore? cacheStore,
  })  : _apiClient = apiClient ?? HttpKavachApiClient(),
        _cacheStore = cacheStore ?? SharedPreferencesAppDataCacheStore();

  final KavachApiClient _apiClient;
  final AppDataCacheStore _cacheStore;

  AppData? _appData;
  AppAuthState _authState = AppAuthState.booting;
  AppDataState _dataState = AppDataState.idle;
  AppLoginStage _loginStage = AppLoginStage.phone;
  String? _errorMessage;
  AuthSession? _session;
  String? _pendingPhoneNumber;
  List<SupportTicketRecord> _supportTicketHistory = const [];
  bool _supportRequestInFlight = false;

  AppData? get appData => _appData;
  AppAuthState get authState => _authState;
  AppDataState get dataState => _dataState;
  AppLoginStage get loginStage => _loginStage;
  String? get pendingPhoneNumber => _pendingPhoneNumber;
  String? get errorMessage => _errorMessage;
  List<SupportTicketRecord> get supportTicketHistory => List.unmodifiable(_supportTicketHistory);
  SupportTicket? get lastSupportTicket => _supportTicketHistory.isEmpty ? null : _supportTicketHistory.first.ticket;
  SupportTicket? get latestSupportTicket => lastSupportTicket;
  bool get isSupportRequestInFlight => _supportRequestInFlight;
  bool get hasStaleData => _appData != null && _dataState == AppDataState.error;

  bool get isLoading =>
      _authState == AppAuthState.booting ||
      _authState == AppAuthState.authenticating ||
      _dataState == AppDataState.loading;

  bool get isAuthenticated => _authState == AppAuthState.authenticated;
  bool get isBooting => _authState == AppAuthState.booting;

  Future<void> restoreSession() async {
    _authState = AppAuthState.booting;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await _apiClient.restoreSession();
      if (session == null) {
        await _resetSignedOut(clearCache: false);
        return;
      }

      _session = session;
      _authState = AppAuthState.authenticated;
      _loginStage = AppLoginStage.phone;
      _pendingPhoneNumber = null;
      await _hydrateCachedState();
      notifyListeners();
      await loadAppData();
    } catch (error) {
      await _resetSignedOut(error: error, clearCache: false);
    }
  }

  Future<void> loginWithPhone(String phone, {String? otp}) async {
    _authState = AppAuthState.authenticating;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    _pendingPhoneNumber = phone;
    notifyListeners();

    try {
      _session = await _apiClient.loginWithPhone(phone, otp: otp);
      _authState = AppAuthState.authenticated;
      _loginStage = AppLoginStage.phone;
      _pendingPhoneNumber = null;
      await _hydrateCachedState();
      notifyListeners();
      await loadAppData();
    } catch (error) {
      if (_isOtpRequired(error)) {
        _session = null;
        _authState = AppAuthState.signedOut;
        _dataState = AppDataState.idle;
        _loginStage = AppLoginStage.otp;
        _errorMessage = _describeError(error);
        notifyListeners();
        return;
      }

      await _resetSignedOut(error: error, clearCache: false);
    }
  }

  Future<void> submitOtp(String otp) async {
    final phone = _pendingPhoneNumber;
    if (phone == null || phone.isEmpty) {
      _errorMessage = 'Enter your phone number before submitting an OTP.';
      notifyListeners();
      return;
    }

    await loginWithPhone(phone, otp: otp);
  }

  Future<void> demoLogin() async {
    _authState = AppAuthState.authenticating;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    _pendingPhoneNumber = null;
    notifyListeners();

    try {
      _session = await _apiClient.demoLogin();
      _authState = AppAuthState.authenticated;
      _loginStage = AppLoginStage.phone;
      await _hydrateCachedState();
      notifyListeners();
      await loadAppData();
    } catch (error) {
      await _resetSignedOut(error: error, clearCache: false);
    }
  }

  Future<void> loadAppData() async {
    if (_authState != AppAuthState.authenticated && _session == null) {
      _dataState = AppDataState.error;
      _errorMessage = 'Please log in to load worker data.';
      notifyListeners();
      return;
    }

    if (_appData == null) {
      try {
        final cachedData = await _cacheStore.loadAppData();
        if (cachedData != null) {
          _appData = AppData.fromJson(cachedData);
        }
      } catch (_) {
        // Cache is best-effort; keep going with live data if storage is unavailable.
      }
    }

    _dataState = AppDataState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _apiClient.fetchAppData();
      _appData = AppData.fromJson(data);
      _dataState = AppDataState.ready;
      _errorMessage = null;
      try {
        await _cacheStore.saveAppData(data);
      } catch (_) {
        // Ignore cache write failures.
      }
    } catch (error) {
      _errorMessage = _describeError(error);

      if (_isUnauthorized(error)) {
        _session = null;
        _authState = AppAuthState.signedOut;
        _loginStage = AppLoginStage.phone;
        _pendingPhoneNumber = null;
        _dataState = AppDataState.idle;
        await _apiClient.clearSession();
      } else {
        _dataState = AppDataState.error;
      }
    } finally {
      notifyListeners();
    }
  }

  Future<SupportTicket?> requestEmergencySupport({String channel = 'callback'}) async {
    _supportRequestInFlight = true;
    notifyListeners();

    try {
      final ticket = await _apiClient.requestEmergencySupport(channel: channel);
      final record = SupportTicketRecord(
        ticket: ticket,
        channel: channel,
        requestedAt: DateTime.now().toUtc().toIso8601String(),
      );
      _supportTicketHistory = [record, ..._supportTicketHistory.where((item) => item.ticket.ticketId != ticket.ticketId)];
      try {
        await _cacheStore.saveSupportTicketHistory(_supportTicketHistory.map((item) => item.toJson()).toList(growable: false));
      } catch (_) {
        // Ignore cache write failures.
      }
      _errorMessage = null;
      notifyListeners();
      return ticket;
    } catch (error) {
      _errorMessage = _describeError(error);
      notifyListeners();
      return null;
    } finally {
      _supportRequestInFlight = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _apiClient.logout();
    try {
      await _cacheStore.clear();
    } catch (_) {
      // Ignore cache cleanup failures on sign out.
    }
    await _resetSignedOut(clearCache: false);
  }

  Future<void> _hydrateCachedState() async {
    try {
      final cachedData = await _cacheStore.loadAppData();
      if (cachedData != null) {
        _appData ??= AppData.fromJson(cachedData);
      }

      final cachedHistory = await _cacheStore.loadSupportTicketHistory();
      if (cachedHistory.isNotEmpty) {
        _supportTicketHistory = cachedHistory
            .map((item) => SupportTicketRecord.fromJson(item))
            .toList(growable: false);
      }
    } catch (_) {
      // Cache is best-effort. Do not block auth or data refresh.
    }
  }

  Future<void> _resetSignedOut({Object? error, required bool clearCache}) async {
    _session = null;
    _authState = AppAuthState.signedOut;
    _dataState = AppDataState.idle;
    _loginStage = AppLoginStage.phone;
    _pendingPhoneNumber = null;
    _errorMessage = error == null ? null : _describeError(error);
    _appData = null;
    _supportTicketHistory = const [];
    if (clearCache) {
      await _cacheStore.clear();
    }
    notifyListeners();
  }

  String _describeError(Object error) {
    if (error is KavachApiException) {
      return error.message;
    }
    return error.toString();
  }

  bool _isUnauthorized(Object error) {
    return error is KavachApiException && error.statusCode == 401;
  }

  bool _isOtpRequired(Object error) {
    if (error is! KavachApiException) {
      return false;
    }

    return error.code == 'otp_required' || error.statusCode == 202;
  }
}
