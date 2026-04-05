import 'package:flutter/foundation.dart';

import '../models/app_data.dart';
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

class AppProvider extends ChangeNotifier {
  AppProvider({KavachApiClient? apiClient}) : _apiClient = apiClient ?? HttpKavachApiClient();

  final KavachApiClient _apiClient;

  AppData? _appData;
  AppAuthState _authState = AppAuthState.booting;
  AppDataState _dataState = AppDataState.idle;
  String? _errorMessage;
  AuthSession? _session;
  SupportTicket? _lastSupportTicket;
  bool _supportRequestInFlight = false;

  AppData? get appData => _appData;
  AppAuthState get authState => _authState;
  AppDataState get dataState => _dataState;
  String? get errorMessage => _errorMessage;
  SupportTicket? get lastSupportTicket => _lastSupportTicket;
  SupportTicket? get latestSupportTicket => _lastSupportTicket;
  bool get isSupportRequestInFlight => _supportRequestInFlight;

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
        _session = null;
        _authState = AppAuthState.signedOut;
        notifyListeners();
        return;
      }

      _session = session;
      _authState = AppAuthState.authenticated;
      await loadAppData();
    } catch (error) {
      _session = null;
      _authState = AppAuthState.signedOut;
      _dataState = AppDataState.idle;
      _errorMessage = _describeError(error);
      _appData = null;
      notifyListeners();
    }
  }

  Future<void> loginWithPhone(String phone) async {
    _authState = AppAuthState.authenticating;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    _appData = null;
    notifyListeners();

    try {
      _session = await _apiClient.loginWithPhone(phone);
      _authState = AppAuthState.authenticated;
      await loadAppData();
    } catch (error) {
      _session = null;
      _authState = AppAuthState.signedOut;
      _dataState = AppDataState.idle;
      _errorMessage = _describeError(error);
      _appData = null;
      notifyListeners();
    }
  }

  Future<void> demoLogin() async {
    _authState = AppAuthState.authenticating;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    _appData = null;
    notifyListeners();

    try {
      _session = await _apiClient.demoLogin();
      _authState = AppAuthState.authenticated;
      await loadAppData();
    } catch (error) {
      _session = null;
      _authState = AppAuthState.signedOut;
      _dataState = AppDataState.idle;
      _errorMessage = _describeError(error);
      _appData = null;
      notifyListeners();
    }
  }

  Future<void> loadAppData() async {
    if (_authState != AppAuthState.authenticated && _session == null) {
      _dataState = AppDataState.error;
      _errorMessage = 'Please log in to load worker data.';
      notifyListeners();
      return;
    }

    _dataState = AppDataState.loading;
    _errorMessage = null;
    _appData = null;
    notifyListeners();

    try {
      final data = await _apiClient.fetchAppData();
      _appData = AppData.fromJson(data);
      _dataState = AppDataState.ready;
    } catch (error) {
      _appData = null;
      _dataState = AppDataState.error;
      _errorMessage = _describeError(error);

      if (_isUnauthorized(error)) {
        _session = null;
        _authState = AppAuthState.signedOut;
        await _apiClient.clearSession();
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
      _lastSupportTicket = ticket;
      _errorMessage = null;
      return ticket;
    } catch (error) {
      _errorMessage = _describeError(error);
      return null;
    } finally {
      _supportRequestInFlight = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _apiClient.logout();
    _appData = null;
    _session = null;
    _authState = AppAuthState.signedOut;
    _dataState = AppDataState.idle;
    _errorMessage = null;
    _lastSupportTicket = null;
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
}
