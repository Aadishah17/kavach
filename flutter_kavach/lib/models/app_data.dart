class AppData {
  final String userName;
  final String platform;
  final String plan;
  final String zone;
  final int trustScore;
  final String trustStatus;
  final int insuredIncome;
  final String coverageStatus;
  final List<DashboardKpi> kpis;
  final List<AlertItem> activeAlerts;
  final List<AlertFeedItem> alertsFeed;
  final List<PayoutItem> payoutHistory;
  final List<PayoutItem> premiumHistory;
  final List<ProfileDocument> profileDocuments;
  final List<EmergencyResource> emergencyResources;
  final Map<String, dynamic> profileSettings;

  AppData({
    required this.userName,
    required this.platform,
    required this.plan,
    required this.zone,
    required this.trustScore,
    required this.trustStatus,
    required this.insuredIncome,
    required this.coverageStatus,
    required this.kpis,
    required this.activeAlerts,
    required this.alertsFeed,
    required this.payoutHistory,
    required this.premiumHistory,
    required this.profileDocuments,
    required this.emergencyResources,
    required this.profileSettings,
  });

  factory AppData.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    final dashboard = json['dashboard'] as Map<String, dynamic>? ?? {};
    final claims = json['claims'] as Map<String, dynamic>? ?? {};
    final alerts = json['alerts'] as Map<String, dynamic>? ?? {};
    final profile = json['profile'] as Map<String, dynamic>? ?? {};

    // Parse KPIs from dashboard
    final kpiList = (dashboard['kpis'] as List?)
            ?.map((e) => DashboardKpi.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Parse dashboard alerts
    final dashAlerts = (dashboard['alerts'] as List?)
            ?.map((e) => AlertItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Parse alerts feed
    final feedItems = (alerts['feed'] as List?)
            ?.map((e) => AlertFeedItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Parse payout and premium history
    final payouts = (claims['payoutHistory'] as List?)
            ?.map((e) => PayoutItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final premiums = (claims['premiumHistory'] as List?)
            ?.map((e) => PayoutItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Parse profile documents
    final docs = (profile['documents'] as List?)
            ?.map((e) => ProfileDocument.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Parse emergency resources
    final resources = (alerts['emergencyResources'] as List?)
            ?.map((e) => EmergencyResource.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    // Extract coverage status
    final coverage = dashboard['coverageStatus'] as Map<String, dynamic>? ?? {};

    // Compute insured weekly income from KPIs or user data
    int iwi = 0;
    if (user['iwi'] != null) {
      iwi = (user['iwi'] is int) ? user['iwi'] : int.tryParse(user['iwi'].toString()) ?? 0;
    }

    return AppData(
      userName: user['name'] as String? ?? 'Worker',
      platform: user['platform'] as String? ?? 'Swiggy',
      plan: user['plan'] as String? ?? 'Kavach Standard',
      zone: user['zone'] as String? ?? 'Koramangala',
      trustScore: user['trustScore'] as int? ?? 0,
      trustStatus: _trustLabel(user['trustScore'] as int? ?? 0),
      insuredIncome: iwi,
      coverageStatus: coverage['label'] as String? ?? 'Active',
      kpis: kpiList,
      activeAlerts: dashAlerts,
      alertsFeed: feedItems,
      payoutHistory: payouts,
      premiumHistory: premiums,
      profileDocuments: docs,
      emergencyResources: resources,
      profileSettings: profile['settings'] as Map<String, dynamic>? ?? {},
    );
  }

  static String _trustLabel(int score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  }
}

class DashboardKpi {
  final String label;
  final String value;
  final String hint;
  final String accent;
  final bool inverse;

  DashboardKpi({
    required this.label,
    required this.value,
    required this.hint,
    required this.accent,
    this.inverse = false,
  });

  factory DashboardKpi.fromJson(Map<String, dynamic> json) {
    return DashboardKpi(
      label: json['label'] as String? ?? '',
      value: json['value'] as String? ?? '',
      hint: json['hint'] as String? ?? '',
      accent: json['accent'] as String? ?? 'navy',
      inverse: json['inverse'] as bool? ?? false,
    );
  }
}

class AlertItem {
  final String title;
  final String severity;
  final String description;
  final int amount;

  AlertItem({
    required this.title,
    required this.severity,
    required this.description,
    required this.amount,
  });

  factory AlertItem.fromJson(Map<String, dynamic> json) {
    return AlertItem(
      title: json['title'] as String? ?? json['label'] as String? ?? 'Alert',
      severity: json['severity'] as String? ?? json['type'] as String? ?? 'info',
      description: json['description'] as String? ?? json['hint'] as String? ?? '',
      amount: json['amount'] as int? ?? json['payoutAmount'] as int? ?? 0,
    );
  }
}

class AlertFeedItem {
  final String icon;
  final String title;
  final String body;
  final String time;
  final String accent;

  AlertFeedItem({
    required this.icon,
    required this.title,
    required this.body,
    required this.time,
    required this.accent,
  });

  factory AlertFeedItem.fromJson(Map<String, dynamic> json) {
    return AlertFeedItem(
      icon: json['icon'] as String? ?? 'info',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['description'] as String? ?? '',
      time: json['time'] as String? ?? json['timestamp'] as String? ?? '',
      accent: json['accent'] as String? ?? 'sky',
    );
  }
}

class PayoutItem {
  final String label;
  final String amount;
  final String date;
  final String status;
  final String type;

  PayoutItem({
    required this.label,
    required this.amount,
    required this.date,
    required this.status,
    required this.type,
  });

  factory PayoutItem.fromJson(Map<String, dynamic> json) {
    return PayoutItem(
      label: json['label'] as String? ?? json['title'] as String? ?? '',
      amount: json['amount']?.toString() ?? '0',
      date: json['date'] as String? ?? json['timestamp'] as String? ?? '',
      status: json['status'] as String? ?? 'Paid',
      type: json['type'] as String? ?? 'payout',
    );
  }
}

class ProfileDocument {
  final String label;
  final String status;
  final String icon;
  final bool verified;

  ProfileDocument({
    required this.label,
    required this.status,
    required this.icon,
    required this.verified,
  });

  factory ProfileDocument.fromJson(Map<String, dynamic> json) {
    return ProfileDocument(
      label: json['label'] as String? ?? json['title'] as String? ?? '',
      status: json['status'] as String? ?? '',
      icon: json['icon'] as String? ?? 'document',
      verified: json['verified'] as bool? ?? false,
    );
  }
}

class EmergencyResource {
  final String label;
  final String number;
  final String icon;

  EmergencyResource({
    required this.label,
    required this.number,
    required this.icon,
  });

  factory EmergencyResource.fromJson(Map<String, dynamic> json) {
    return EmergencyResource(
      label: json['label'] as String? ?? json['name'] as String? ?? '',
      number: json['number'] as String? ?? json['phone'] as String? ?? '',
      icon: json['icon'] as String? ?? 'phone',
    );
  }
}
