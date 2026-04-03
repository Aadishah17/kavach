import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/app_data.dart';
import '../theme/app_theme.dart';

class ClaimsScreen extends StatelessWidget {
  const ClaimsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final claims = provider.appData?.recentClaims ?? [];

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Payout History & Claims'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTrustSignals(context),
            const SizedBox(height: 32),
            Text('Recent Events', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 16),
            if (claims.isEmpty)
              const Center(child: Text("No claims or payouts yet.")),
            ...claims.map((c) => _buildClaimCard(context, c)),
          ],
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

  Widget _buildClaimCard(BuildContext context, Claim claim) {
    final isDeduction = claim.title.toLowerCase().contains("premium");
    final amountColor = isDeduction ? AppTheme.textPrimary : AppTheme.green;
    final sign = isDeduction ? "-" : "+";

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
                Text(claim.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text('${claim.status} • ${claim.date}', style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          Text('$sign₹${claim.amount}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: amountColor)),
        ],
      ),
    );
  }
}
