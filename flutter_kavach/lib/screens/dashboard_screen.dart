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
        body: Center(child: CircularProgressIndicator(color: AppTheme.navy)),
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
                const Icon(
                  Icons.cloud_off_rounded,
                  size: 52,
                  color: AppTheme.textSecondary,
                ),
                const SizedBox(height: 14),
                Text(
                  'Unable to load worker dashboard',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  provider.errorMessage ?? 'Pull to retry or sign in again.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
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
              if (provider.hasStaleData) ...[
                _StaleBanner(
                  message:
                      provider.errorMessage ??
                      'Showing the last synced worker dashboard.',
                  onRetry: provider.loadAppData,
                ),
                const SizedBox(height: 16),
              ],
              _Header(data: data),
              const SizedBox(height: 16),
              _TopRail(data: data, provider: provider),
              const SizedBox(height: 16),
              _Hero(data: data, provider: provider),
              const SizedBox(height: 16),
              _FraudCard(data: data),
              const SizedBox(height: 16),
              _TriggerCard(data: data),
              const SizedBox(height: 16),
              _SecondaryCard(data: data, provider: provider),
              if (provider.latestSupportTicket != null) ...[
                const SizedBox(height: 16),
                _SupportTicketCard(ticket: provider.latestSupportTicket!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.data});
  final AppData data;

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Morning watch'
        : hour < 17
        ? 'Afternoon watch'
        : 'Evening watch';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: Theme.of(
                  context,
                ).textTheme.labelLarge?.copyWith(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 4),
              Text(
                data.userName,
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 6),
              Text(
                '${data.platform} • ${data.zone}',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: Colors.white,
            border: Border.all(
              color: AppTheme.outlineVariant.withValues(alpha: 0.35),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Trust', style: Theme.of(context).textTheme.labelMedium),
              Text(
                '${data.trustScore}/100',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppTheme.navy,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TopRail extends StatelessWidget {
  const _TopRail({required this.data, required this.provider});
  final AppData data;
  final AppProvider provider;

  @override
  Widget build(BuildContext context) {
    final risk = _riskAccent(data.riskOutlook.level);
    final support = provider.isSupportRequestInFlight
        ? 'Support queueing'
        : provider.latestSupportTicket != null
        ? 'Support queued'
        : 'No active ticket';

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: 'Protection now',
                value: '₹${data.riskOutlook.protectedAmount}',
                detail: '${data.riskOutlook.coverageHours}h cover',
                icon: Icons.shield_rounded,
                accent: AppTheme.navy,
                tint: AppTheme.navy.withValues(alpha: 0.08),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                title: 'Risk level',
                value: _riskLabel(data.riskOutlook.level),
                detail: '${data.trustStatus} trust',
                icon: _riskIcon(data.riskOutlook.level),
                accent: risk,
                tint: risk.withValues(alpha: 0.08),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _SummaryCard(
          title: 'Payout / support',
          value: '₹${data.payoutState.amount}',
          detail:
              '$support • ${data.payoutState.provider} ${data.payoutState.status}',
          icon: Icons.account_balance_wallet_rounded,
          accent: data.payoutState.status.toLowerCase() == 'paid'
              ? AppTheme.green
              : AppTheme.skyBlue,
          tint: AppTheme.skyBlue.withValues(alpha: 0.08),
          fullWidth: true,
        ),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.data, required this.provider});
  final AppData data;
  final AppProvider provider;

  @override
  Widget build(BuildContext context) {
    final isSubmitting = provider.isSupportRequestInFlight;
    final actions = <Widget>[
      _ActionTile(
        label: isSubmitting ? 'Queueing support...' : 'Request support',
        description: 'Fast escalation',
        icon: isSubmitting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.navy,
                ),
              )
            : const Icon(Icons.support_agent_rounded, size: 18),
        dark: true,
        width: 160,
        onTap: isSubmitting ? null : () => _requestSupport(context, provider),
      ),
      _ActionTile(
        label: 'Refresh status',
        description: 'Pull latest data',
        icon: const Icon(Icons.refresh_rounded, size: 18),
        dark: true,
        width: 160,
        onTap: provider.loadAppData,
      ),
      ..._quickActions(context, data, provider),
    ];

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(
          colors: [AppTheme.navy, Color(0xFF0B395A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.20),
            blurRadius: 26,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(
                  _riskIcon(data.riskOutlook.level),
                  color: AppTheme.gold,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
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
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(color: Colors.white, height: 1.15),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            data.riskOutlook.summary,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Colors.white70,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _Tag(text: '${data.riskOutlook.coverageHours}h cover'),
              _Tag(
                text:
                    'Premium ${_signedAmount(data.dynamicPremium.premiumDelta)}',
              ),
              _Tag(text: 'Next: ${data.riskOutlook.nextLikelyTrigger}'),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Immediate actions',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white60,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(spacing: 10, runSpacing: 10, children: actions),
          const SizedBox(height: 18),
          Text(
            'Operational snapshot',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white60,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: data.kpis
                .take(4)
                .map((kpi) {
                  return _KpiTile(
                    label: kpi.label,
                    value: kpi.value,
                    hint: kpi.hint,
                    accent: _kpiAccent(kpi.accent),
                    inverse: kpi.inverse,
                  );
                })
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _FraudCard extends StatelessWidget {
  const _FraudCard({required this.data});
  final AppData data;

  @override
  Widget build(BuildContext context) {
    final tone = _fraudColor(data.fraudAssessment.status);
    return _SectionCard(
      icon: Icons.verified_user_outlined,
      title: 'Fraud confidence',
      subtitle: data.fraudAssessment.summary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: tone.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  '${data.fraudAssessment.score}/100',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: tone,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                data.fraudAssessment.status.toUpperCase(),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: tone,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...data.fraudAssessment.signals.take(3).map((signal) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.circle,
                    size: 10,
                    color: _fraudColor(signal.status),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          signal.label,
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          signal.reason,
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _TriggerCard extends StatelessWidget {
  const _TriggerCard({required this.data});
  final AppData data;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      icon: Icons.radar_rounded,
      title: 'Trigger watch',
      subtitle: 'Likely triggers and their probability',
      tint: AppTheme.gold.withValues(alpha: 0.10),
      accent: AppTheme.gold,
      child: Column(
        children: data.triggerEvaluations
            .map((trigger) {
              final tone = _triggerColor(trigger.status);
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppTheme.outlineVariant.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        margin: const EdgeInsets.only(top: 5),
                        decoration: BoxDecoration(
                          color: tone,
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
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleLarge,
                                  ),
                                ),
                                Text(
                                  '${trigger.probability}%',
                                  style: Theme.of(context).textTheme.labelLarge
                                      ?.copyWith(color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              trigger.detail,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            })
            .toList(growable: false),
      ),
    );
  }
}

class _SecondaryCard extends StatelessWidget {
  const _SecondaryCard({required this.data, required this.provider});
  final AppData data;
  final AppProvider provider;

  @override
  Widget build(BuildContext context) {
    final autopayColor = data.autopayState.enabled
        ? AppTheme.skyBlue
        : AppTheme.orange;
    final supportState = provider.isSupportRequestInFlight
        ? 'Support queueing'
        : provider.latestSupportTicket != null
        ? 'Support queued'
        : 'No active ticket';

    return _SectionCard(
      icon: Icons.receipt_long_rounded,
      title: 'Secondary details',
      subtitle: 'Payout rail, autopay, and support state',
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  title: 'Payout rail',
                  value: '₹${data.payoutState.amount}',
                  detail:
                      '${data.payoutState.provider} • ${data.payoutState.rail}',
                  accent: AppTheme.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _InfoTile(
                  title: 'Autopay',
                  value: data.autopayState.mandateStatus.toUpperCase(),
                  detail: data.autopayState.nextCharge.isEmpty
                      ? 'Next charge pending'
                      : data.autopayState.nextCharge,
                  accent: autopayColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _InfoTile(
            title: 'Support state',
            value: provider.latestSupportTicket == null
                ? supportState
                : 'Ticket ${provider.latestSupportTicket!.ticketId}',
            detail: provider.latestSupportTicket?.message ?? 'No open ticket',
            accent: provider.latestSupportTicket == null
                ? AppTheme.skyBlue
                : AppTheme.green,
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}

class _SupportTicketCard extends StatelessWidget {
  const _SupportTicketCard({required this.ticket});
  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
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
                Text(
                  'Support queued',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${ticket.message} • ${ticket.ticketId}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.child,
    this.tint = Colors.white,
    this.accent = AppTheme.navy,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;
  final Color tint;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: tint == Colors.white ? Colors.white : AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: accent.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: accent, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    required this.detail,
    required this.icon,
    required this.accent,
    required this.tint,
    this.fullWidth = false,
  });

  final String title;
  final String value;
  final String detail;
  final IconData icon;
  final Color accent;
  final Color tint;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withValues(alpha: 0.16)),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: tint,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: accent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: AppTheme.textSecondary,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  detail,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.title,
    required this.value,
    required this.detail,
    required this.accent,
    this.fullWidth = false,
  });

  final String title;
  final String value;
  final String detail;
  final Color accent;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accent.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: accent,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            detail,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.label,
    required this.description,
    required this.icon,
    required this.onTap,
    required this.dark,
    required this.width,
  });

  final String label;
  final String description;
  final Widget icon;
  final VoidCallback? onTap;
  final bool dark;
  final double width;

  @override
  Widget build(BuildContext context) {
    final foreground = dark ? AppTheme.navy : AppTheme.textPrimary;
    final background = dark ? Colors.white : AppTheme.surfaceLowest;
    final borderColor = dark
        ? Colors.white.withValues(alpha: 0.08)
        : AppTheme.outlineVariant.withValues(alpha: 0.25);

    return SizedBox(
      width: width,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: dark
                        ? AppTheme.navy.withValues(alpha: 0.08)
                        : AppTheme.surfaceLow,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconTheme(
                    data: IconThemeData(color: foreground, size: 18),
                    child: icon,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: foreground,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(color: AppTheme.textSecondary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  const _KpiTile({
    required this.label,
    required this.value,
    required this.hint,
    required this.accent,
    required this.inverse,
  });

  final String label;
  final String value;
  final String hint;
  final Color accent;
  final bool inverse;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 156,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: inverse ? AppTheme.navy : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: inverse ? Colors.transparent : accent.withValues(alpha: 0.16),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: inverse ? Colors.white60 : AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: inverse ? Colors.white : accent,
              fontWeight: FontWeight.w800,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            hint,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: inverse ? Colors.white60 : AppTheme.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Text(
        text,
        style: Theme.of(
          context,
        ).textTheme.labelLarge?.copyWith(color: Colors.white70),
      ),
    );
  }
}

class _StaleBanner extends StatelessWidget {
  const _StaleBanner({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.gold.withValues(alpha: 0.28)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, color: AppTheme.gold),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: Theme.of(context).textTheme.bodyMedium),
          ),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

Future<void> _requestSupport(BuildContext context, AppProvider provider) async {
  await provider.requestEmergencySupport();
  if (!context.mounted) return;
  final message =
      provider.latestSupportTicket?.message ?? provider.errorMessage;
  if (message != null && message.isNotEmpty) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

List<Widget> _quickActions(
  BuildContext context,
  AppData data,
  AppProvider provider,
) {
  if (data.quickActions.isEmpty) return const [];
  return data.quickActions
      .take(3)
      .map((action) {
        return _ActionTile(
          label: action.label,
          description: action.description,
          icon: Icon(_quickActionIcon(action.action), size: 18),
          dark: true,
          width: 160,
          onTap: () async {
            final normalized = action.action.toLowerCase();
            if (normalized.contains('support')) {
              await _requestSupport(context, provider);
            } else if (normalized.contains('refresh') ||
                normalized.contains('sync') ||
                normalized.contains('retry')) {
              await provider.loadAppData();
            } else if (context.mounted) {
              final msg = action.description.isNotEmpty
                  ? action.description
                  : action.label;
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(msg)));
            }
          },
        );
      })
      .toList(growable: false);
}

Color _kpiAccent(String accent) {
  switch (accent) {
    case 'green':
      return AppTheme.green;
    case 'sky':
      return AppTheme.skyBlue;
    case 'gold':
      return AppTheme.gold;
    case 'navy':
      return AppTheme.navy;
    default:
      return AppTheme.navy;
  }
}

Color _fraudColor(String status) {
  switch (status.toLowerCase()) {
    case 'review':
      return AppTheme.red;
    case 'watch':
      return AppTheme.orange;
    default:
      return AppTheme.green;
  }
}

Color _triggerColor(String status) {
  switch (status.toLowerCase()) {
    case 'triggered':
      return AppTheme.red;
    case 'watch':
      return AppTheme.gold;
    default:
      return AppTheme.green;
  }
}

Color _riskAccent(String level) {
  switch (level) {
    case 'high':
      return AppTheme.red;
    case 'moderate':
      return AppTheme.orange;
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

String _riskLabel(String level) {
  switch (level) {
    case 'high':
      return 'High';
    case 'moderate':
      return 'Watch';
    default:
      return 'Low';
  }
}

String _signedAmount(int value) {
  if (value == 0) {
    return '₹0';
  }
  return value > 0 ? '+₹$value' : '-₹${value.abs()}';
}

IconData _quickActionIcon(String action) {
  final normalized = action.toLowerCase();
  if (normalized.contains('support')) {
    return Icons.support_agent_rounded;
  }
  if (normalized.contains('refresh') || normalized.contains('sync')) {
    return Icons.refresh_rounded;
  }
  if (normalized.contains('alert')) {
    return Icons.notifications_active_rounded;
  }
  return Icons.bolt_rounded;
}
