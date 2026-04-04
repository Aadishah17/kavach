import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/app_data.dart';
import '../theme/app_theme.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;
    final feedItems = data?.alertsFeed ?? [];
    final emergencyResources = data?.emergencyResources ?? [];

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Alerts & Notifications'),
      ),
      body: RefreshIndicator(
        color: AppTheme.navy,
        onRefresh: () => provider.loadAppData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLiveStatusBanner(context),
              const SizedBox(height: 24),
              if (feedItems.isNotEmpty) ...[
                Text('Notifications', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 16),
                ...feedItems.map((item) => _buildAlertItem(
                      context,
                      icon: _iconForString(item.icon),
                      title: item.title,
                      subtitle: item.body,
                      time: item.time,
                      accentColor: _colorForAccent(item.accent),
                      isUrgent: item.accent == 'red',
                    )),
              ] else ...[
                _buildAlertItem(
                  context,
                  icon: Icons.cloud,
                  title: 'Heavy Rain Alert – Koramangala',
                  subtitle: 'Parametric trigger activated. Estimated payout: ₹571',
                  time: '2h ago',
                  accentColor: AppTheme.red,
                  isUrgent: true,
                ),
                _buildAlertItem(
                  context,
                  icon: Icons.check_circle_outline,
                  title: 'Daily Premium Paid',
                  subtitle: 'AutoPay of ₹12.00 processed successfully',
                  time: '6h ago',
                  accentColor: AppTheme.green,
                ),
                _buildAlertItem(
                  context,
                  icon: Icons.verified_user,
                  title: 'Verification Success',
                  subtitle: 'GPS + movement data validated for today',
                  time: '8h ago',
                  accentColor: AppTheme.skyBlue,
                ),
              ],
              const SizedBox(height: 32),
              _buildEmergencyResources(context, emergencyResources),
            ],
          ),
        ),
      ),
    );
  }

  IconData _iconForString(String icon) {
    switch (icon) {
      case 'cloud':
        return Icons.cloud;
      case 'check':
        return Icons.check_circle_outline;
      case 'shield':
        return Icons.verified_user;
      case 'wallet':
        return Icons.account_balance_wallet;
      case 'score':
        return Icons.shield_rounded;
      case 'rain':
        return Icons.water_drop;
      case 'warning':
        return Icons.warning_amber_rounded;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForAccent(String accent) {
    switch (accent) {
      case 'red':
        return AppTheme.red;
      case 'green':
        return AppTheme.green;
      case 'gold':
        return AppTheme.gold;
      case 'sky':
        return AppTheme.skyBlue;
      default:
        return AppTheme.skyBlue;
    }
  }

  Widget _buildLiveStatusBanner(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.navy, Color(0xFF002F5F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.green.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.radar, color: AppTheme.green, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DIGITAL GUARDIAN ACTIVE',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.green,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Monitoring weather, GPS & network signals',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
    required Color accentColor,
    bool isUrgent = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: isUrgent
            ? Border.all(color: accentColor.withValues(alpha: 0.4), width: 2)
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: accentColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(subtitle, style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          ),
          Text(time, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildEmergencyResources(BuildContext context, List<EmergencyResource> resources) {
    // Use API data if available, otherwise fallback
    final displayResources = resources.isNotEmpty
        ? resources
        : [
            EmergencyResource(label: 'NDRF Helpline', number: '1078', icon: 'hospital'),
            EmergencyResource(label: 'Kavach Support', number: '1800-XXX-XXXX', icon: 'phone'),
            EmergencyResource(label: 'Police', number: '112', icon: 'police'),
          ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Emergency Resources', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          ...displayResources.map((r) {
            IconData icon;
            switch (r.icon) {
              case 'hospital':
                icon = Icons.local_hospital;
                break;
              case 'police':
                icon = Icons.local_police;
                break;
              default:
                icon = Icons.phone;
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: AppTheme.skyBlue),
                  const SizedBox(width: 12),
                  Text(r.label, style: Theme.of(context).textTheme.bodyMedium),
                  const Spacer(),
                  Text(r.number, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: AppTheme.skyBlue)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
