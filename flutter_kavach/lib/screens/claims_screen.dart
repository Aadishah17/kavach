import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class ClaimsScreen extends StatelessWidget {
  const ClaimsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;
    final payouts = data?.payoutHistory ?? [];
    final premiums = data?.premiumHistory ?? [];

    // Combine and interleave for a unified timeline
    final allItems = <_TimelineEntry>[];
    for (final p in payouts) {
      allItems.add(_TimelineEntry(
        label: p.label,
        amount: p.amount,
        date: p.date,
        status: p.status,
        isPayout: true,
      ));
    }
    for (final p in premiums) {
      allItems.add(_TimelineEntry(
        label: p.label,
        amount: p.amount,
        date: p.date,
        status: p.status,
        isPayout: false,
      ));
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Payout History & Claims'),
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
              _buildTrustSignals(context),
              const SizedBox(height: 32),
              Text('Recent Events', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 16),
              if (allItems.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long, size: 48, color: AppTheme.textSecondary.withValues(alpha: 0.5)),
                        const SizedBox(height: 12),
                        const Text('No claims or payouts yet.'),
                      ],
                    ),
                  ),
                ),
              ...allItems.map((entry) => _buildClaimCard(context, entry)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrustSignals(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Kavach AI Guardian', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSignal('Movement', Icons.speed),
              _buildSignal('Network', Icons.wifi),
              _buildSignal('Weather', Icons.cloud),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSignal(String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.skyBlue, size: 28),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(width: 4),
            const Icon(Icons.check_circle, color: AppTheme.green, size: 14),
          ],
        ),
      ],
    );
  }

  Widget _buildClaimCard(BuildContext context, _TimelineEntry entry) {
    final amountColor = entry.isPayout ? AppTheme.green : AppTheme.textPrimary;
    final sign = entry.isPayout ? '+' : '-';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.label, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text('${entry.status} • ${entry.date}', style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          Text('$sign₹${entry.amount}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: amountColor)),
        ],
      ),
    );
  }
}

class _TimelineEntry {
  final String label;
  final String amount;
  final String date;
  final String status;
  final bool isPayout;

  _TimelineEntry({
    required this.label,
    required this.amount,
    required this.date,
    required this.status,
    required this.isPayout,
  });
}
