import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/app_data.dart';

class AppProvider extends ChangeNotifier {
  AppData? _appData;
  bool _isLoading = false;
  String? _error;

  AppData? get appData => _appData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAppData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.getAppData();
      _appData = AppData.fromJson(data);
    } catch (e) {
      _error = e.toString();
      // Provide fallback mock data for UI testing if backend is down
      _appData = AppData(
        userName: 'Rajesh K.',
        platform: 'Swiggy',
        trustScore: 92,
        trustStatus: 'Excellent',
        insuredIncome: 4000,
        activeAlerts: [
          Alert(title: 'Heavy Rain in Koramangala', status: 'Triggered', amount: 571)
        ],
        recentClaims: [
          Claim(title: 'Heavy Rain in Koramangala', status: 'Paid', amount: 571, date: 'Today'),
          Claim(title: 'Weekly AutoPay Premium', status: 'Paid', amount: 49, date: 'Yesterday')
        ],
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
