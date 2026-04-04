import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/app_data.dart';

class AppProvider extends ChangeNotifier {
  AppData? _appData;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  AppData? get appData => _appData;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  /// Try to restore a previous session on app launch
  Future<void> restoreSession() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final session = await ApiService.restoreSession();
      if (session != null) {
        _isAuthenticated = true;
        await loadAppData();
        return;
      }
    } catch (_) {
      // Session restore failed silently
    }

    _isLoading = false;
    _isAuthenticated = false;
    notifyListeners();
  }

  /// Demo login — quick entry for testing
  Future<void> demoLogin() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.demoLogin();
      _isAuthenticated = true;
      await loadAppData();
    } catch (e) {
      _error = e.toString();
      _isAuthenticated = false;
      // Provide fallback mock data so the UI still renders
      _appData = _buildFallbackData();
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load app data from the API (must be authenticated)
  Future<void> loadAppData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.getAppData();
      _appData = AppData.fromJson(data);
    } catch (e) {
      _error = e.toString();
      if (e.toString().contains('Session expired')) {
        _isAuthenticated = false;
        await ApiService.clearToken();
      }
      // Provide fallback data if API is unreachable
      _appData ??= _buildFallbackData();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Logout — clear session and app data
  Future<void> logout() async {
    await ApiService.logout();
    _appData = null;
    _isAuthenticated = false;
    _error = null;
    notifyListeners();
  }

  AppData _buildFallbackData() {
    return AppData(
      userName: 'Rajesh K.',
      platform: 'Swiggy',
      plan: 'Kavach Standard',
      zone: 'Koramangala',
      trustScore: 92,
      trustStatus: 'Excellent',
      insuredIncome: 4000,
      coverageStatus: 'Active',
      kpis: [
        DashboardKpi(label: 'Payout this week', value: '₹571', hint: '↑ Tuesday rain event', accent: 'green'),
        DashboardKpi(label: 'Trust score', value: '92', hint: '↑ Excellent', accent: 'sky'),
        DashboardKpi(label: 'Days protected', value: '3 days', hint: 'Mon–Wed covered', accent: 'gold'),
        DashboardKpi(label: 'Insured weekly income', value: '₹4,000', hint: 'Standard', accent: 'navy', inverse: true),
      ],
      activeAlerts: [
        AlertItem(title: 'Heavy Rain in Koramangala', severity: 'critical', description: 'Parametric trigger activated', amount: 571),
      ],
      alertsFeed: [
        AlertFeedItem(icon: 'cloud', title: 'Heavy Rain Alert – Koramangala', body: 'Parametric trigger activated. Estimated payout: ₹571', time: '2h ago', accent: 'red'),
        AlertFeedItem(icon: 'check', title: 'Daily Premium Paid', body: 'AutoPay of ₹12.00 processed successfully', time: '6h ago', accent: 'green'),
        AlertFeedItem(icon: 'shield', title: 'Verification Success', body: 'GPS + movement data validated for today', time: '8h ago', accent: 'sky'),
      ],
      payoutHistory: [
        PayoutItem(label: 'Heavy Rain – Koramangala', amount: '571', date: 'Today', status: 'Paid', type: 'payout'),
      ],
      premiumHistory: [
        PayoutItem(label: 'Weekly AutoPay Premium', amount: '49', date: 'Yesterday', status: 'Paid', type: 'premium'),
      ],
      profileDocuments: [
        ProfileDocument(label: 'Aadhaar Card', status: 'Verified', icon: 'article', verified: true),
        ProfileDocument(label: 'Driving License', status: 'Active', icon: 'drive', verified: false),
      ],
      emergencyResources: [
        EmergencyResource(label: 'NDRF Helpline', number: '1078', icon: 'hospital'),
        EmergencyResource(label: 'Kavach Support', number: '1800-XXX-XXXX', icon: 'phone'),
        EmergencyResource(label: 'Police', number: '112', icon: 'police'),
      ],
      profileSettings: {
        'smartAlerts': true,
        'biometricLock': true,
        'language': 'English',
      },
    );
  }
}
