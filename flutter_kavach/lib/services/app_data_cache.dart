import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_data.dart';

class SupportTicketRecord {
  const SupportTicketRecord({
    required this.ticket,
    required this.channel,
    required this.requestedAt,
  });

  final SupportTicket ticket;
  final String channel;
  final String requestedAt;

  factory SupportTicketRecord.fromJson(Map<String, dynamic> json) {
    return SupportTicketRecord(
      ticket: SupportTicket.fromJson(Map<String, dynamic>.from(json['ticket'] as Map? ?? const {})),
      channel: json['channel']?.toString() ?? 'callback',
      requestedAt: json['requestedAt']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'ticket': ticket.toJson(),
        'channel': channel,
        'requestedAt': requestedAt,
      };
}

abstract interface class AppDataCacheStore {
  Future<Map<String, dynamic>?> loadAppData();
  Future<void> saveAppData(Map<String, dynamic> data);
  Future<List<Map<String, dynamic>>> loadSupportTicketHistory();
  Future<void> saveSupportTicketHistory(List<Map<String, dynamic>> tickets);
  Future<void> clear();
}

class SharedPreferencesAppDataCacheStore implements AppDataCacheStore {
  SharedPreferencesAppDataCacheStore({
    SharedPreferences? preferences,
  }) : _preferences = preferences;

  static const String _appDataKey = 'kavach_cached_app_data';
  static const String _supportHistoryKey = 'kavach_support_ticket_history';

  final SharedPreferences? _preferences;

  Future<SharedPreferences> get _prefs async => _preferences ?? SharedPreferences.getInstance();

  @override
  Future<Map<String, dynamic>?> loadAppData() async {
    final prefs = await _prefs;
    final encoded = prefs.getString(_appDataKey);
    if (encoded == null || encoded.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(encoded);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    if (decoded is Map) {
      return decoded.map((key, value) => MapEntry(key.toString(), value));
    }

    return null;
  }

  @override
  Future<void> saveAppData(Map<String, dynamic> data) async {
    final prefs = await _prefs;
    await prefs.setString(_appDataKey, jsonEncode(data));
  }

  @override
  Future<List<Map<String, dynamic>>> loadSupportTicketHistory() async {
    final prefs = await _prefs;
    final encoded = prefs.getString(_supportHistoryKey);
    if (encoded == null || encoded.isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(encoded);
    if (decoded is! List) {
      return const [];
    }

    return decoded
        .whereType<Map>()
        .map((item) => item.map((key, value) => MapEntry(key.toString(), value)))
        .toList(growable: false);
  }

  @override
  Future<void> saveSupportTicketHistory(List<Map<String, dynamic>> tickets) async {
    final prefs = await _prefs;
    await prefs.setString(_supportHistoryKey, jsonEncode(tickets));
  }

  @override
  Future<void> clear() async {
    final prefs = await _prefs;
    await prefs.remove(_appDataKey);
    await prefs.remove(_supportHistoryKey);
  }
}
