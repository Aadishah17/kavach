import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Alerts & Notifications'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLiveStatusBanner(context),
            const SizedBox(height: 24),
            Text('Today', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 16),
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
            const SizedBox(height: 32),
            Text('Yesterday', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 16),
            _buildAlertItem(
              context,
              icon: Icons.account_balance_wallet,
              title: 'Payout Credited',
              subtitle: '₹571 sent to your UPI. Txn ID: KV20260403',
              time: '1d ago',
              accentColor: AppTheme.green,
            ),
            _buildAlertItem(
              context,
              icon: Icons.shield_rounded,
              title: 'Trust Score Updated',
              subtitle: 'Your trust score improved to 92/100',
              time: '1d ago',
              accentColor: AppTheme.gold,
            ),
            const SizedBox(height: 32),
            _buildEmergencyResources(context),
          ],
        ),
      ),
    );
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

  Widget _buildEmergencyResources(BuildContext context) {
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
          _buildResourceRow(context, Icons.local_hospital, 'NDRF Helpline', '1078'),
          const SizedBox(height: 12),
          _buildResourceRow(context, Icons.phone, 'Kavach Support', '1800-XXX-XXXX'),
          const SizedBox(height: 12),
          _buildResourceRow(context, Icons.local_police, 'Police', '112'),
        ],
      ),
    );
  }

  Widget _buildResourceRow(BuildContext context, IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.skyBlue),
        const SizedBox(width: 12),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        const Spacer(),
        Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: AppTheme.skyBlue)),
      ],
    );
  }
}
