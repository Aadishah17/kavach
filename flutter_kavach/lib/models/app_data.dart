class AppData {
  final String userName;
  final String platform;
  final int trustScore;
  final String trustStatus;
  final int insuredIncome;
  final List<Alert> activeAlerts;
  final List<Claim> recentClaims;

  AppData({
    required this.userName,
    required this.platform,
    required this.trustScore,
    required this.trustStatus,
    required this.insuredIncome,
    required this.activeAlerts,
    required this.recentClaims,
  });

  factory AppData.fromJson(Map<String, dynamic> json) {
    // Gracefully handle missing or malformed data from the backend
    return AppData(
      userName: json['user']?['name'] ?? 'Rajesh K.',
      platform: json['user']?['platform'] ?? 'Swiggy',
      trustScore: json['user']?['trustScore'] ?? 92,
      trustStatus: json['user']?['trustStatus'] ?? 'Excellent',
      insuredIncome: json['verification']?['incomeParams']?['weeklyAverage'] ?? 4000,
      activeAlerts: (json['alerts'] as List?)?.map((e) => Alert.fromJson(e)).toList() ?? [],
      recentClaims: (json['claims'] as List?)?.map((e) => Claim.fromJson(e)).toList() ?? [],
    );
  }
}

class Alert {
  final String title;
  final String status;
  final int amount;

  Alert({required this.title, required this.status, required this.amount});

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      title: json['title'] ?? 'Alert',
      status: json['status'] ?? 'Active',
      amount: json['amount'] ?? 0,
    );
  }
}

class Claim {
  final String title;
  final String status;
  final int amount;
  final String date;

  Claim({required this.title, required this.status, required this.amount, required this.date});

  factory Claim.fromJson(Map<String, dynamic> json) {
    return Claim(
      title: json['title'] ?? 'Claim',
      status: json['status'] ?? 'Paid',
      amount: json['amount'] ?? 0,
      date: json['date'] ?? '',
    );
  }
}
