import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/app_data.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;

    if (provider.isLoading && data == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.navy),
        ),
      );
    }

    if (data == null) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 52, color: AppTheme.textSecondary),
                const SizedBox(height: 14),
                Text('Unable to load worker dashboard', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  provider.errorMessage ?? 'Pull to retry or sign in again.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: provider.loadAppData,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.navy,
          onRefresh: provider.loadAppData,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            children: [
              _buildHeader(context, data),
              const SizedBox(height: 20),
              _buildHeroCard(context, data, provider),
              const SizedBox(height: 16),
              _buildKpiGrid(context, data),
              const SizedBox(height: 16),
              _buildRiskAndPayoutRow(context, data),
              const SizedBox(height: 16),
              _buildFraudCard(context, data),
              const SizedBox(height: 16),
              _buildTriggerRail(context, data),
              if (provider.latestSupportTicket != null) ...[
                const SizedBox(height: 16),
                _buildSupportTicketCard(context, provider.latestSupportTicket!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppData data) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Morning watch' : hour < 17 ? 'Afternoon watch' : 'Evening watch';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                data.userName,
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 6),
              Text(
                '${data.platform} • ${data.zone}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: Colors.white,
            border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Trust', style: Theme.of(context).textTheme.labelMedium),
              Text(
                '${data.trustScore}/100',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.navy),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(BuildContext context, AppData data, AppProvider provider) {
    final isSubmitting = provider.isSupportRequestInFlight;

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [AppTheme.navy, Color(0xFF0A3551)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.18),
            blurRadius: 24,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  _riskIcon(data.riskOutlook.level),
                  color: AppTheme.gold,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Coverage active',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: Colors.white60,
                            letterSpacing: 0.6,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${data.riskOutlook.protectedAmount} protected this week',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            data.riskOutlook.summary,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white70,
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _buildMetricChip(context, '${data.riskOutlook.coverageHours}h cover'),
              _buildMetricChip(context, 'Premium ${data.dynamicPremium.premiumDelta >= 0 ? '+' : ''}₹${data.dynamicPremium.premiumDelta}'),
              _buildMetricChip(context, 'Next: ${data.riskOutlook.nextLikelyTrigger}'),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      await provider.requestEmergencySupport();
                      if (!context.mounted) {
                        return;
                      }

                      final message = provider.latestSupportTicket?.message ?? provider.errorMessage;
                      if (message != null && message.isNotEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(message)),
                        );
                      }
                    },
              icon: isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.navy),
                    )
                  : const Icon(Icons.support_agent_rounded),
              label: Text(isSubmitting ? 'Queueing support...' : 'Request emergency support'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.gold,
                foregroundColor: AppTheme.navy,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiGrid(BuildContext context, AppData data) {
    final accentMap = <String, Color>{
      'green': AppTheme.green,
      'sky': AppTheme.skyBlue,
      'gold': AppTheme.gold,
      'navy': AppTheme.navy,
    };

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: data.kpis.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.28,
      ),
      itemBuilder: (context, index) {
        final kpi = data.kpis[index];
        final accent = accentMap[kpi.accent] ?? AppTheme.navy;
        final inverse = kpi.inverse;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: inverse ? AppTheme.navy : Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: inverse ? Colors.transparent : AppTheme.outlineVariant.withValues(alpha: 0.28),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                kpi.label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: inverse ? Colors.white60 : AppTheme.textSecondary,
                    ),
              ),
              const Spacer(),
              Text(
                kpi.value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: inverse ? Colors.white : accent,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                kpi.hint,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: inverse ? Colors.white54 : AppTheme.textSecondary,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRiskAndPayoutRow(BuildContext context, AppData data) {
    return Row(
      children: [
        Expanded(
          child: _buildPanel(
            context,
            title: 'Payout rail',
            icon: Icons.account_balance_wallet_rounded,
            children: [
              Text(
                '₹${data.payoutState.amount}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppTheme.green),
              ),
              const SizedBox(height: 8),
              Text(
                '${data.payoutState.provider} • ${data.payoutState.status}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 6),
              Text(
                data.payoutState.rail,
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildPanel(
            context,
            title: 'AutoPay',
            icon: Icons.sync_alt_rounded,
            children: [
              Text(
                data.autopayState.mandateStatus.toUpperCase(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: data.autopayState.enabled ? AppTheme.skyBlue : AppTheme.orange,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                data.autopayState.nextCharge.isEmpty ? 'Next charge pending' : data.autopayState.nextCharge,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFraudCard(BuildContext context, AppData data) {
    return _buildPanel(
      context,
      title: 'Fraud trust',
      icon: Icons.verified_user_outlined,
      children: [
        Row(
          children: [
            Text(
              '${data.fraudAssessment.score}/100',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: AppTheme.navy),
            ),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _fraudColor(data.fraudAssessment.status).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                data.fraudAssessment.status.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: _fraudColor(data.fraudAssessment.status),
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          data.fraudAssessment.summary,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 14),
        ...data.fraudAssessment.signals.take(3).map(
              (signal) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.circle, size: 10, color: _fraudColor(signal.status)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(signal.label, style: Theme.of(context).textTheme.labelLarge),
                          const SizedBox(height: 2),
                          Text(
                            signal.reason,
                            style: Theme.of(context).textTheme.labelMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
  }

  Widget _buildTriggerRail(BuildContext context, AppData data) {
    return _buildPanel(
      context,
      title: 'Automated triggers',
      icon: Icons.radar_rounded,
      children: data.triggerEvaluations
          .map(
            (trigger) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    margin: const EdgeInsets.only(top: 5),
                    decoration: BoxDecoration(
                      color: _triggerColor(trigger.status),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                trigger.name,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ),
                            Text(
                              '${trigger.probability}%',
                              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          trigger.detail,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildSupportTicketCard(BuildContext context, SupportTicket ticket) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.green.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.green.withValues(alpha: 0.22)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline_rounded, color: AppTheme.green),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Support queued', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text(
                  '${ticket.message} • ${ticket.ticketId}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPanel(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.navy, size: 18),
              const SizedBox(width: 8),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildMetricChip(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: Colors.white.withValues(alpha: 0.08),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white70),
      ),
    );
  }

  Color _fraudColor(String status) {
    switch (status) {
      case 'review':
        return AppTheme.red;
      case 'watch':
        return AppTheme.orange;
      default:
        return AppTheme.green;
    }
  }

  Color _triggerColor(String status) {
    switch (status) {
      case 'triggered':
        return AppTheme.red;
      case 'watch':
        return AppTheme.gold;
      default:
        return AppTheme.green;
    }
  }

  IconData _riskIcon(String level) {
    switch (level) {
      case 'high':
        return Icons.warning_amber_rounded;
      case 'moderate':
        return Icons.waves_rounded;
      default:
        return Icons.shield_moon_rounded;
    }
  }
}
