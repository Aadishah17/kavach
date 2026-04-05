class AppData {
  final String userName;
  final String platform;
  final String plan;
  final String zone;
  final int trustScore;
  final String trustStatus;
  final int insuredIncome;
  final String coverageStatus;
  final String dateRange;
  final List<DashboardKpi> kpis;
  final List<AlertItem> activeAlerts;
  final List<AlertFeedItem> alertsFeed;
  final List<PayoutItem> payoutHistory;
  final List<PayoutItem> premiumHistory;
  final List<ProfileDocument> profileDocuments;
  final List<EmergencyResource> emergencyResources;
  final List<SupportContact> supportContacts;
  final List<PolicyCoverageItem> policyCoverage;
  final List<TriggerCardData> triggerCards;
  final List<TriggerEvaluation> triggerEvaluations;
  final List<DashboardQuickAction> quickActions;
  final List<String> verificationSignals;
  final RiskOutlook riskOutlook;
  final RiskOutlook dynamicPremium;
  final PayoutState payoutState;
  final AutopayState autopayState;
  final FraudAssessment fraudAssessment;
  final int monthlyProtectedAmount;
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
    required this.dateRange,
    required this.kpis,
    required this.activeAlerts,
    required this.alertsFeed,
    required this.payoutHistory,
    required this.premiumHistory,
    required this.profileDocuments,
    required this.emergencyResources,
    required this.supportContacts,
    required this.policyCoverage,
    required this.triggerCards,
    required this.triggerEvaluations,
    required this.quickActions,
    required this.verificationSignals,
    required this.riskOutlook,
    required this.dynamicPremium,
    required this.payoutState,
    required this.autopayState,
    required this.fraudAssessment,
    required this.monthlyProtectedAmount,
    required this.profileSettings,
  });

  factory AppData.fromJson(Map<String, dynamic> json) {
    final user = _mapOf(json['user']);
    final dashboard = _mapOf(json['dashboard']);
    final claims = _mapOf(json['claims']);
    final policy = _mapOf(json['policy']);
    final alerts = _mapOf(json['alerts']);
    final profile = _mapOf(json['profile']);

    final trustScore = _readInt(user['trustScore']);
    final riskOutlook = RiskOutlook.fromJson(
      _mapOf(dashboard['riskOutlook']).isNotEmpty ? dashboard['riskOutlook'] : policy['dynamicPremium'],
    );
    final dynamicPremium = RiskOutlook.fromJson(
      _mapOf(policy['dynamicPremium']).isNotEmpty ? policy['dynamicPremium'] : dashboard['riskOutlook'],
    );
    final payoutState = PayoutState.fromJson(
      _mapOf(claims['payoutState']).isNotEmpty ? claims['payoutState'] : dashboard['payoutState'],
    );
    final autopayState = AutopayState.fromJson(_mapOf(policy['autopayState']));
    final fraudAssessment = FraudAssessment.fromJson(
      _mapOf(claims['fraudAssessment']).isNotEmpty ? claims['fraudAssessment'] : dashboard['fraudAssessment'],
    );

    final activeAlerts = _mapOf(claims['activeAlert']).isNotEmpty
        ? <AlertItem>[AlertItem.fromJson(claims['activeAlert'] as Map<String, dynamic>)]
        : _mapOf(dashboard['activeAlert']).isNotEmpty
            ? <AlertItem>[AlertItem.fromJson(dashboard['activeAlert'] as Map<String, dynamic>)]
            : _mapList(claims['alerts']).isNotEmpty
                ? _mapList(claims['alerts']).map((item) => AlertItem.fromJson(item)).toList()
                : _mapList(dashboard['alerts']).map((item) => AlertItem.fromJson(item)).toList();

    final payoutHistory = _mapList(claims['payoutHistory']).map((item) => PayoutItem.fromJson(item)).toList();
    final premiumHistory = _mapList(claims['premiumHistory']).isNotEmpty
        ? _mapList(claims['premiumHistory']).map((item) => PayoutItem.fromJson(item)).toList()
        : _mapList(policy['premiumHistory']).map((item) => PayoutItem.fromJson(item)).toList();

    return AppData(
      userName: _readString(user['name'], 'Worker'),
      platform: _readString(user['platform'], 'Gig Work'),
      plan: _readString(user['plan'], 'Kavach Standard'),
      zone: _readString(user['zone'], 'Unknown Zone'),
      trustScore: trustScore,
      trustStatus: _readString(user['trustStatus'], _trustLabel(trustScore)),
      insuredIncome: _readInt(user['iwi']),
      coverageStatus: _readString(dashboard['coverageStatus'], _readString(claims['coverageStatus'], 'Active')),
      dateRange: _readString(dashboard['dateRange']),
      kpis: _mapList(dashboard['kpis']).map((item) => DashboardKpi.fromJson(item)).toList(),
      activeAlerts: activeAlerts,
      alertsFeed: _mapList(alerts['feed']).map((item) => AlertFeedItem.fromJson(item)).toList(),
      payoutHistory: payoutHistory,
      premiumHistory: premiumHistory,
      profileDocuments: _mapList(profile['documents']).map((item) => ProfileDocument.fromJson(item)).toList(),
      emergencyResources: _mapList(alerts['emergencyResources']).map((item) => EmergencyResource.fromJson(item)).toList(),
      supportContacts: _mapList(alerts['supportContacts']).map((item) => SupportContact.fromJson(item)).toList(),
      policyCoverage: _mapList(policy['coverage']).map((item) => PolicyCoverageItem.fromJson(item)).toList(),
      triggerCards: _mapList(policy['triggers']).map((item) => TriggerCardData.fromJson(item)).toList(),
      triggerEvaluations: _mapList(dashboard['triggerEvaluations']).map((item) => TriggerEvaluation.fromJson(item)).toList(),
      quickActions: _mapList(dashboard['quickActions']).map((item) => DashboardQuickAction.fromJson(item)).toList(),
      verificationSignals: _stringList(claims['verificationSignals']),
      riskOutlook: riskOutlook,
      dynamicPremium: dynamicPremium,
      payoutState: payoutState,
      autopayState: autopayState,
      fraudAssessment: fraudAssessment,
      monthlyProtectedAmount: _readInt(profile['monthlyProtectedAmount']),
      profileSettings: _profileSettingsMap(profile['settings']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': {
        'name': userName,
        'platform': platform,
        'plan': plan,
        'zone': zone,
        'trustScore': trustScore,
        'trustStatus': trustStatus,
        'iwi': insuredIncome,
      },
      'dashboard': {
        'dateRange': dateRange,
        'coverageStatus': coverageStatus,
        'kpis': kpis
            .map(
              (item) => {
                'label': item.label,
                'value': item.value,
                'hint': item.hint,
                'accent': item.accent,
                'inverse': item.inverse,
              },
            )
            .toList(growable: false),
        'riskOutlook': {
          'level': riskOutlook.level,
          'summary': riskOutlook.summary,
          'nextLikelyTrigger': riskOutlook.nextLikelyTrigger,
          'premiumDelta': riskOutlook.premiumDelta,
          'protectedAmount': riskOutlook.protectedAmount,
          'coverageHours': riskOutlook.coverageHours,
          'confidence': riskOutlook.confidence,
        },
        'payoutState': {
          'reference': payoutState.reference,
          'amount': payoutState.amount,
          'status': payoutState.status,
          'provider': payoutState.provider,
          'rail': payoutState.rail,
          'etaMinutes': payoutState.etaMinutes,
          'updatedAt': payoutState.updatedAt,
        },
        'fraudAssessment': {
          'score': fraudAssessment.score,
          'status': fraudAssessment.status,
          'summary': fraudAssessment.summary,
          'signals': fraudAssessment.signals
              .map(
                (signal) => {
                  'label': signal.label,
                  'score': signal.score,
                  'status': signal.status,
                  'reason': signal.reason,
                },
              )
              .toList(growable: false),
        },
        'triggerEvaluations': triggerEvaluations
            .map(
              (item) => {
                'id': item.id,
                'name': item.name,
                'source': item.source,
                'status': item.status,
                'detail': item.detail,
                'probability': item.probability,
              },
            )
            .toList(growable: false),
        'quickActions': quickActions
            .map(
              (item) => {
                'id': item.id,
                'label': item.label,
                'description': item.description,
                'action': item.action,
                'tone': item.tone,
              },
            )
            .toList(growable: false),
      },
      'claims': {
        'payoutHistory': payoutHistory
            .map(
              (item) => {
                'label': item.label,
                'amount': item.amount,
                'date': item.date,
                'status': item.status,
                'type': item.type,
              },
            )
            .toList(growable: false),
        'premiumHistory': premiumHistory
            .map(
              (item) => {
                'label': item.label,
                'amount': item.amount,
                'date': item.date,
                'status': item.status,
                'type': item.type,
              },
            )
            .toList(growable: false),
        'payoutState': {
          'reference': payoutState.reference,
          'amount': payoutState.amount,
          'status': payoutState.status,
          'provider': payoutState.provider,
          'rail': payoutState.rail,
          'etaMinutes': payoutState.etaMinutes,
          'updatedAt': payoutState.updatedAt,
        },
        'fraudAssessment': {
          'score': fraudAssessment.score,
          'status': fraudAssessment.status,
          'summary': fraudAssessment.summary,
          'signals': fraudAssessment.signals
              .map(
                (signal) => {
                  'label': signal.label,
                  'score': signal.score,
                  'status': signal.status,
                  'reason': signal.reason,
                },
              )
              .toList(growable: false),
        },
        'verificationSignals': verificationSignals,
        'alerts': activeAlerts
            .map(
              (item) => {
                'title': item.title,
                'severity': item.severity,
                'description': item.description,
                'amount': item.amount,
              },
            )
            .toList(growable: false),
        'activeAlert': activeAlerts.isNotEmpty
            ? {
                'title': activeAlerts.first.title,
                'severity': activeAlerts.first.severity,
                'description': activeAlerts.first.description,
                'amount': activeAlerts.first.amount,
              }
            : null,
      },
      'policy': {
        'coverage': policyCoverage
            .map(
              (item) => {
                'title': item.title,
                'description': item.description,
                'badge': item.badge,
              },
            )
            .toList(growable: false),
        'triggers': triggerCards
            .map(
              (item) => {
                'emoji': item.emoji,
                'name': item.name,
                'condition': item.condition,
                'coverage': item.coverage,
              },
            )
            .toList(growable: false),
        'premiumHistory': premiumHistory
            .map(
              (item) => {
                'label': item.label,
                'amount': item.amount,
                'date': item.date,
                'status': item.status,
                'type': item.type,
              },
            )
            .toList(growable: false),
        'dynamicPremium': {
          'level': dynamicPremium.level,
          'summary': dynamicPremium.summary,
          'nextLikelyTrigger': dynamicPremium.nextLikelyTrigger,
          'premiumDelta': dynamicPremium.premiumDelta,
          'protectedAmount': dynamicPremium.protectedAmount,
          'coverageHours': dynamicPremium.coverageHours,
          'confidence': dynamicPremium.confidence,
        },
        'autopayState': {
          'enabled': autopayState.enabled,
          'mandateStatus': autopayState.mandateStatus,
          'nextCharge': autopayState.nextCharge,
          'note': autopayState.note,
        },
      },
      'alerts': {
        'feed': alertsFeed
            .map(
              (item) => {
                'icon': item.icon,
                'title': item.title,
                'body': item.body,
                'time': item.time,
                'accent': item.accent,
                'status': item.status,
              },
            )
            .toList(growable: false),
        'emergencyResources': emergencyResources
            .map(
              (item) => {
                'label': item.label,
                'number': item.number,
                'icon': item.icon,
                'description': item.description,
                'cta': item.cta,
              },
            )
            .toList(growable: false),
        'supportContacts': supportContacts
            .map(
              (item) => {
                'initials': item.initials,
                'name': item.name,
                'relation': item.relation,
                'phone': item.phone,
              },
            )
            .toList(growable: false),
      },
      'profile': {
        'documents': profileDocuments
            .map(
              (item) => {
                'label': item.label,
                'status': item.status,
                'icon': item.icon,
                'verified': item.verified,
              },
            )
            .toList(growable: false),
        'settings': profileSettings,
        'monthlyProtectedAmount': monthlyProtectedAmount,
      },
    };
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
      label: _readString(json['label']),
      value: _readString(json['value']),
      hint: _readString(json['hint']),
      accent: _readString(json['accent'], 'navy'),
      inverse: _readBool(json['inverse']),
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
      title: _readString(json['title'], _readString(json['label'], 'Alert')),
      severity: _readString(json['severity'], _readString(json['type'], 'info')),
      description: _readString(json['description'], _readString(json['hint'])),
      amount: _readInt(json['amount'], _readInt(json['payoutAmount'])),
    );
  }
}

class AlertFeedItem {
  final String icon;
  final String title;
  final String body;
  final String time;
  final String accent;
  final String status;

  AlertFeedItem({
    required this.icon,
    required this.title,
    required this.body,
    required this.time,
    required this.accent,
    required this.status,
  });

  factory AlertFeedItem.fromJson(Map<String, dynamic> json) {
    final status = _readString(json['status'], _readString(json['tone'], 'info'));
    return AlertFeedItem(
      icon: _readString(json['icon'], _iconFromCategory(_readString(json['category']))),
      title: _readString(json['title']),
      body: _readString(json['body'], _readString(json['description'])),
      time: _readString(json['time'], _readString(json['timestamp'])),
      accent: _readString(json['accent'], _accentFromStatus(status)),
      status: status,
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
      label: _readString(json['label'], _readString(json['title'], _readString(json['cycle']))),
      amount: _readInt(json['amount'], _readInt(json['value'])).toString(),
      date: _readString(json['date'], _readString(json['paidOn'], _readString(json['timestamp']))),
      status: _readString(json['status'], 'Paid'),
      type: _readString(json['type'], _readString(json['kind'], 'payout')),
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
    final status = _readString(json['status'], _readString(json['meta']));
    return ProfileDocument(
      label: _readString(json['label'], _readString(json['name'], _readString(json['title'], 'Document'))),
      status: status,
      icon: _readString(json['icon'], 'document'),
      verified: _readBool(json['verified'], status.toLowerCase().contains('verified')),
    );
  }
}

class EmergencyResource {
  final String label;
  final String number;
  final String icon;
  final String description;
  final String cta;

  EmergencyResource({
    required this.label,
    required this.number,
    required this.icon,
    required this.description,
    required this.cta,
  });

  factory EmergencyResource.fromJson(Map<String, dynamic> json) {
    return EmergencyResource(
      label: _readString(json['label'], _readString(json['title'], _readString(json['name'], 'Support'))),
      number: _readString(json['number'], _readString(json['phone'], _readString(json['cta']))),
      icon: _readString(json['icon'], 'phone'),
      description: _readString(json['description']),
      cta: _readString(json['cta'], _readString(json['number'], _readString(json['phone']))),
    );
  }
}

class SupportContact {
  final String initials;
  final String name;
  final String relation;
  final String phone;

  SupportContact({
    required this.initials,
    required this.name,
    required this.relation,
    required this.phone,
  });

  factory SupportContact.fromJson(Map<String, dynamic> json) {
    return SupportContact(
      initials: _readString(json['initials'], _initialsFor(_readString(json['name'], _readString(json['title'], 'Support')))),
      name: _readString(json['name'], _readString(json['title'], 'Support')),
      relation: _readString(json['relation'], _readString(json['description'])),
      phone: _readString(json['phone'], _readString(json['number'])),
    );
  }
}

class PolicyCoverageItem {
  final String title;
  final String description;
  final String badge;

  PolicyCoverageItem({
    required this.title,
    required this.description,
    required this.badge,
  });

  factory PolicyCoverageItem.fromJson(Map<String, dynamic> json) {
    return PolicyCoverageItem(
      title: _readString(json['title'], _readString(json['name'], 'Coverage')),
      description: _readString(json['description']),
      badge: _readString(json['badge'], _readString(json['status'], 'Active')),
    );
  }
}

class TriggerCardData {
  final String emoji;
  final String name;
  final String condition;
  final int coverage;

  TriggerCardData({
    required this.emoji,
    required this.name,
    required this.condition,
    required this.coverage,
  });

  factory TriggerCardData.fromJson(Map<String, dynamic> json) {
    return TriggerCardData(
      emoji: _readString(json['emoji'], _iconFromCategory(_readString(json['name']))),
      name: _readString(json['name'], _readString(json['title'], 'Trigger')),
      condition: _readString(json['condition']),
      coverage: _readInt(json['coverage']),
    );
  }
}

class TriggerEvaluation {
  final String id;
  final String name;
  final String source;
  final String status;
  final String detail;
  final int probability;

  TriggerEvaluation({
    required this.id,
    required this.name,
    required this.source,
    required this.status,
    required this.detail,
    required this.probability,
  });

  factory TriggerEvaluation.fromJson(Map<String, dynamic> json) {
    return TriggerEvaluation(
      id: _readString(json['id'], _readString(json['name'])),
      name: _readString(json['name'], _readString(json['label'], 'Trigger')),
      source: _readString(json['source'], 'public'),
      status: _readString(json['status'], 'clear'),
      detail: _readString(json['detail'], _readString(json['description'])),
      probability: _readInt(json['probability']),
    );
  }
}

class DashboardQuickAction {
  final String id;
  final String label;
  final String description;
  final String action;
  final String tone;

  DashboardQuickAction({
    required this.id,
    required this.label,
    required this.description,
    required this.action,
    required this.tone,
  });

  factory DashboardQuickAction.fromJson(Map<String, dynamic> json) {
    return DashboardQuickAction(
      id: _readString(json['id'], _readString(json['label'], 'action')),
      label: _readString(json['label']),
      description: _readString(json['description']),
      action: _readString(json['action'], 'support'),
      tone: _readString(json['tone'], 'secondary'),
    );
  }
}

class RiskOutlook {
  final String level;
  final String summary;
  final String nextLikelyTrigger;
  final int premiumDelta;
  final int protectedAmount;
  final int coverageHours;
  final int confidence;

  RiskOutlook({
    required this.level,
    required this.summary,
    required this.nextLikelyTrigger,
    required this.premiumDelta,
    required this.protectedAmount,
    required this.coverageHours,
    required this.confidence,
  });

  factory RiskOutlook.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return RiskOutlook(
        level: 'low',
        summary: 'No active risk outlook',
        nextLikelyTrigger: 'No active trigger',
        premiumDelta: 0,
        protectedAmount: 0,
        coverageHours: 0,
        confidence: 0,
      );
    }

    return RiskOutlook(
      level: _readString(json['level'], 'low'),
      summary: _readString(json['summary']),
      nextLikelyTrigger: _readString(json['nextLikelyTrigger'], _readString(json['nextTrigger'])),
      premiumDelta: _readInt(json['premiumDelta']),
      protectedAmount: _readInt(json['protectedAmount']),
      coverageHours: _readInt(json['coverageHours']),
      confidence: _readInt(json['confidence']),
    );
  }
}

class FraudSignal {
  final String label;
  final int score;
  final String status;
  final String reason;

  FraudSignal({
    required this.label,
    required this.score,
    required this.status,
    required this.reason,
  });

  factory FraudSignal.fromJson(Map<String, dynamic> json) {
    return FraudSignal(
      label: _readString(json['label'], _readString(json['name'], 'Signal')),
      score: _readInt(json['score']),
      status: _readString(json['status'], 'clear'),
      reason: _readString(json['reason']),
    );
  }
}

class FraudAssessment {
  final int score;
  final String status;
  final String summary;
  final List<FraudSignal> signals;

  FraudAssessment({
    required this.score,
    required this.status,
    required this.summary,
    required this.signals,
  });

  factory FraudAssessment.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return FraudAssessment(score: 0, status: 'clear', summary: 'No fraud assessment available', signals: const []);
    }

    return FraudAssessment(
      score: _readInt(json['score']),
      status: _readString(json['status'], 'clear'),
      summary: _readString(json['summary']),
      signals: _mapList(json['signals']).map((item) => FraudSignal.fromJson(item)).toList(),
    );
  }
}

class PayoutState {
  final String reference;
  final int amount;
  final String status;
  final String provider;
  final String rail;
  final int etaMinutes;
  final String updatedAt;

  PayoutState({
    required this.reference,
    required this.amount,
    required this.status,
    required this.provider,
    required this.rail,
    required this.etaMinutes,
    required this.updatedAt,
  });

  factory PayoutState.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return PayoutState(
        reference: '',
        amount: 0,
        status: 'monitoring',
        provider: 'upi_mock',
        rail: 'UPI',
        etaMinutes: 0,
        updatedAt: '',
      );
    }

    return PayoutState(
      reference: _readString(json['reference']),
      amount: _readInt(json['amount']),
      status: _readString(json['status'], 'monitoring'),
      provider: _readString(json['provider'], 'upi_mock'),
      rail: _readString(json['rail'], 'UPI'),
      etaMinutes: _readInt(json['etaMinutes']),
      updatedAt: _readString(json['updatedAt'], _readString(json['timestamp'])),
    );
  }
}

class AutopayState {
  final bool enabled;
  final String mandateStatus;
  final String nextCharge;
  final String note;

  AutopayState({
    required this.enabled,
    required this.mandateStatus,
    required this.nextCharge,
    required this.note,
  });

  factory AutopayState.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return AutopayState(
        enabled: true,
        mandateStatus: 'active',
        nextCharge: '',
        note: '',
      );
    }

    return AutopayState(
      enabled: _readBool(json['enabled'], true),
      mandateStatus: _readString(json['mandateStatus'], 'active'),
      nextCharge: _readString(json['nextCharge']),
      note: _readString(json['note']),
    );
  }
}

class LoginPayload {
  final String phone;
  final String? otp;

  LoginPayload({
    required this.phone,
    this.otp,
  });

  Map<String, dynamic> toJson() {
    final payload = <String, dynamic>{'phone': phone};
    if (otp != null && otp!.isNotEmpty) {
      payload['otp'] = otp;
    }
    return payload;
  }
}

class AuthSession {
  final String token;
  final Map<String, dynamic> user;

  const AuthSession({
    required this.token,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: _readString(json['token']),
      user: _mapOf(json['user']),
    );
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'user': user,
      };
}

class SupportTicket {
  final String ticketId;
  final String status;
  final String message;

  const SupportTicket({
    required this.ticketId,
    required this.status,
    required this.message,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      ticketId: _readString(json['ticketId']),
      status: _readString(json['status']),
      message: _readString(json['message']),
    );
  }

  Map<String, dynamic> toJson() => {
        'ticketId': ticketId,
        'status': status,
        'message': message,
      };
}

Map<String, dynamic> _mapOf(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, dynamic val) => MapEntry(key.toString(), val));
  }
  return <String, dynamic>{};
}

List<Map<String, dynamic>> _mapList(dynamic value) {
  if (value is! Iterable) {
    return const [];
  }
  return value.map(_mapOf).where((item) => item.isNotEmpty).toList();
}

List<String> _stringList(dynamic value) {
  if (value is! Iterable) {
    return const [];
  }
  return value.map((item) => _readString(item)).where((item) => item.isNotEmpty).toList();
}

int _readInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is num) return value.toInt();
  if (value == null) return fallback;
  return int.tryParse(value.toString()) ?? fallback;
}

String _readString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  final text = value.toString();
  return text.isEmpty ? fallback : text;
}

bool _readBool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value == null) return fallback;
  final text = value.toString().toLowerCase();
  if (text == 'true') return true;
  if (text == 'false') return false;
  return fallback;
}

String _accentFromStatus(String status) {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'green';
    case 'triggered':
      return 'red';
    case 'watch':
      return 'gold';
    default:
      return 'sky';
  }
}

String _iconFromCategory(String category) {
  switch (category.toLowerCase()) {
    case 'payout':
      return 'wallet';
    case 'fraud':
      return 'shield';
    case 'support':
      return 'phone';
    case 'weather':
      return 'cloud';
    default:
      return 'info';
  }
}

String _initialsFor(String label) {
  final parts = label.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
  if (parts.isEmpty) return 'KV';
  if (parts.length == 1) {
    final end = parts.first.length < 2 ? parts.first.length : 2;
    return parts.first.substring(0, end).toUpperCase();
  }
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}

Map<String, dynamic> _profileSettingsMap(dynamic value) {
  final settings = _mapList(value);
  final map = <String, dynamic>{};

  for (final setting in settings) {
    final label = _readString(setting['label']);
    final key = _settingKey(label);
    final enabled = _readBool(setting['enabled']);
    final settingValue = _readString(setting['value']);

    if (key.isNotEmpty) {
      map[key] = enabled;
    }

    if (label.isNotEmpty) {
      map[label] = settingValue.isNotEmpty ? settingValue : enabled;
    }
  }

  return map;
}

String _settingKey(String label) {
  final lower = label.trim().toLowerCase();
  if (lower.isEmpty) return '';
  if (lower.contains('language')) return 'language';
  if (lower.contains('smart') && lower.contains('alert')) return 'smartAlerts';
  if (lower.contains('biometric')) return 'biometricLock';
  final parts = lower.split(RegExp(r'[^a-z0-9]+')).where((part) => part.isNotEmpty).toList();
  if (parts.isEmpty) return '';
  final first = parts.first;
  final rest = parts.skip(1).map((part) => part[0].toUpperCase() + part.substring(1)).join();
  return '$first$rest';
}
