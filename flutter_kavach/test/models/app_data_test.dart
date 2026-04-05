import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_kavach/models/app_data.dart';

void main() {
  test('parses richer worker dashboard, claims, policy and support payloads', () {
    final data = AppData.fromJson({
      'user': {
        'name': 'Meera Jain',
        'platform': 'Swiggy',
        'plan': 'Standard',
        'zone': 'Koramangala',
        'trustScore': 88,
        'iwi': 5400,
      },
      'dashboard': {
        'dateRange': 'Mar 31 - Apr 6',
        'coverageStatus': 'active',
        'riskOutlook': {
          'level': 'moderate',
          'summary': 'Weather risk is rising in east Bengaluru',
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
          'signals': [
            {
              'label': 'Location consistency',
              'score': 96,
              'status': 'clear',
              'reason': 'Trip trail matches zone watch pattern',
            },
          ],
        },
        'triggerEvaluations': [
          {
            'id': 'rain-1',
            'name': 'Rain intensity',
            'source': 'public',
            'status': 'triggered',
            'detail': 'Monsoon band over Koramangala',
            'probability': 86,
          },
        ],
        'quickActions': [
          {
            'id': 'support',
            'label': 'Emergency support',
            'description': 'Request callback',
            'action': 'support',
            'tone': 'primary',
          },
        ],
      },
      'claims': {
        'activeAlert': {
          'type': 'rainfall',
          'emoji': 'cloud',
          'zone': 'Koramangala',
          'condition': 'Heavy rain',
          'payoutAmount': 571,
          'triggeredAt': '2026-04-05T06:55:00Z',
          'paidAt': '2026-04-05T07:05:00Z',
          'coverage': 82,
        },
        'verificationSignals': ['GPS stable', 'Rainfall detected'],
        'payoutHistory': [
          {
            'date': 'Today',
            'type': 'payout',
            'disruption': 'Heavy rain',
            'zone': 'Koramangala',
            'amount': 571,
            'status': 'Paid',
          },
        ],
        'premiumHistory': [
          {
            'cycle': 'Weekly AutoPay',
            'paidOn': 'Yesterday',
            'amount': 49,
            'note': 'Autopay succeeded',
          },
        ],
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
          'signals': [
            {
              'label': 'Location consistency',
              'score': 96,
              'status': 'clear',
              'reason': 'Trip trail matches zone watch pattern',
            },
          ],
        },
      },
      'policy': {
        'coverage': [
          {
            'title': 'Rainfall coverage',
            'description': 'Protects income during intense rain windows',
            'badge': 'Active',
          },
        ],
        'triggers': [
          {
            'emoji': 'cloud',
            'name': 'Rain intensity',
            'condition': '15mm rainfall in 60 minutes',
            'coverage': 82,
          },
        ],
        'premiumHistory': [
          {
            'cycle': 'Weekly AutoPay',
            'paidOn': 'Yesterday',
            'amount': 49,
            'note': 'Autopay succeeded',
          },
        ],
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
        'feed': [
          {
            'category': 'payout',
            'title': 'Instant payout sent',
            'description': '₹571 deposited to your wallet',
            'status': 'paid',
          },
        ],
        'emergencyResources': [
          {
            'title': 'Kavach Support',
            'description': '24/7 worker help desk',
            'cta': 'Call now',
          },
        ],
        'supportContacts': [
          {
            'initials': 'KS',
            'name': 'Kavach Support',
            'relation': 'Help desk',
            'phone': '1800-123-456',
          },
        ],
      },
      'profile': {
        'documents': [
          {
            'name': 'Aadhaar',
            'meta': 'Verified',
            'status': 'active',
          },
        ],
        'settings': [
          {
            'label': 'Smart alerts',
            'value': 'Peak hours only',
            'enabled': true,
          },
        ],
        'monthlyProtectedAmount': 24000,
      },
    });

    expect(data.userName, 'Meera Jain');
    expect(data.trustScore, 88);
    expect(data.riskOutlook.level, 'moderate');
    expect(data.payoutState.reference, 'pay_123');
    expect(data.fraudAssessment.signals, hasLength(1));
    expect(data.triggerEvaluations, hasLength(1));
    expect(data.quickActions.first.action, 'support');
    expect(data.dynamicPremium.premiumDelta, 12);
    expect(data.supportContacts.first.phone, '1800-123-456');
    expect(data.monthlyProtectedAmount, 24000);
  });

  test('round-trips app data through cache json', () {
    final original = AppData.fromJson({
      'user': {
        'name': 'Meera Jain',
        'platform': 'Swiggy',
        'plan': 'Standard',
        'zone': 'Koramangala',
        'trustScore': 88,
        'iwi': 5400,
      },
      'dashboard': {
        'dateRange': 'Mar 31 - Apr 6',
        'coverageStatus': 'active',
        'kpis': [
          {
            'label': 'Protected',
            'value': '₹7,600',
            'hint': 'Coverage is live',
            'accent': 'green',
          },
        ],
        'riskOutlook': {
          'level': 'moderate',
          'summary': 'Weather risk is rising in east Bengaluru',
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
      },
      'claims': {
        'payoutHistory': const [],
        'premiumHistory': const [],
        'verificationSignals': ['GPS stable'],
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
    });

    final encoded = original.toJson();
    final restored = AppData.fromJson(encoded);

    expect(restored.userName, original.userName);
    expect(restored.platform, original.platform);
    expect(restored.riskOutlook.summary, original.riskOutlook.summary);
    expect(restored.payoutState.reference, original.payoutState.reference);
    expect(restored.profileSettings, original.profileSettings);
  });
}
