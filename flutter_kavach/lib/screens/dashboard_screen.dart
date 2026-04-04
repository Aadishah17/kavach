import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;

    if (provider.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.navy)));
    }

    if (data == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: AppTheme.textSecondary),
              const SizedBox(height: 16),
              Text('Unable to load data', style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => provider.loadAppData(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.navy,
          onRefresh: () => provider.loadAppData(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, data.userName, data.platform),
                const SizedBox(height: 32),
                _buildTrustScoreCard(context, data.trustScore, data.trustStatus),
                const SizedBox(height: 24),
                if (data.kpis.isNotEmpty) ...[
                  _buildKpiGrid(context, data),
                  const SizedBox(height: 24),
                ],
                _buildIncomeCard(context, data.insuredIncome),
                const SizedBox(height: 24),
                if (data.activeAlerts.isNotEmpty)
                  _buildActiveAlertCard(
                    context,
                    data.activeAlerts.first.title,
                    data.activeAlerts.first.amount,
                    data.activeAlerts.first.description,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String name, String platform) {
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning,';
    } else if (hour < 17) {
      greeting = 'Good Afternoon,';
    } else {
      greeting = 'Good Evening,';
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(greeting, style: Theme.of(context).textTheme.bodyLarge),
              Text(name.isNotEmpty ? name : 'Worker', style: Theme.of(context).textTheme.displaySmall),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.surfaceLow,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.5)),
          ),
          child: Row(
            children: [
              const Icon(Icons.delivery_dining, size: 16, color: AppTheme.skyBlue),
              const SizedBox(width: 4),
              Text(platform.isNotEmpty ? platform : 'Platform', style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTrustScoreCard(BuildContext context, int score, String status) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.15),
            blurRadius: 32,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Kavach Trust Score', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white70)),
              const Icon(Icons.shield_rounded, color: AppTheme.gold),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$score', style: Theme.of(context).textTheme.displayLarge?.copyWith(color: Colors.white, fontSize: 48)),
              const SizedBox(width: 4),
              Text('/100', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white54)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.green.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status.toUpperCase(),
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppTheme.green, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiGrid(BuildContext context, data) {
    final kpis = data.kpis;
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.6,
      children: kpis.map<Widget>((kpi) {
        Color accentColor;
        switch (kpi.accent) {
          case 'green':
            accentColor = AppTheme.green;
            break;
          case 'sky':
            accentColor = AppTheme.skyBlue;
            break;
          case 'gold':
            accentColor = AppTheme.gold;
            break;
          default:
            accentColor = AppTheme.navy;
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: kpi.inverse ? AppTheme.navy : AppTheme.surfaceLowest,
            borderRadius: BorderRadius.circular(16),
            border: kpi.inverse ? null : Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                kpi.label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: kpi.inverse ? Colors.white60 : AppTheme.textSecondary,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                kpi.value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: kpi.inverse ? Colors.white : accentColor,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                kpi.hint,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: kpi.inverse ? Colors.white38 : AppTheme.textSecondary,
                      fontSize: 11,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildIncomeCard(BuildContext context, int income) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Insured Weekly Income', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 4),
              Text('₹${income > 0 ? income.toString() : "—"}', style: Theme.of(context).textTheme.displayMedium),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: AppTheme.surfaceLow,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.account_balance_wallet, color: AppTheme.skyBlue),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveAlertCard(BuildContext context, String title, int amount, String description) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.red.withValues(alpha: 0.3), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppTheme.red),
              const SizedBox(width: 8),
              Text('Active Alert', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.red)),
            ],
          ),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(description, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary)),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Est. Payout', style: Theme.of(context).textTheme.bodyMedium),
              Text('₹$amount', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.green)),
            ],
          ),
        ],
      ),
    );
  }
}
