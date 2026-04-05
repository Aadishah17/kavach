import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/app_data.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class ClaimsScreen extends StatelessWidget {
  const ClaimsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;

    if (provider.isLoading && data == null) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(child: CircularProgressIndicator(color: AppTheme.navy)),
      );
    }

    if (data == null) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _EmptyState(
                title: 'Claims data unavailable',
                body: provider.errorMessage ?? 'Sign in to review payout state and fraud transparency.',
                actionLabel: 'Retry',
                onAction: provider.isAuthenticated ? () => provider.loadAppData() : null,
              ),
            ),
          ),
        ),
      );
    }

    final timelineSections = _buildTimelineSections(data);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Claims & payouts'),
      ),
      body: RefreshIndicator(
        color: AppTheme.navy,
        onRefresh: provider.loadAppData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (provider.hasStaleData) ...[
                _StaleBanner(
                  message: provider.errorMessage ?? 'Showing the last synced payout and claims activity.',
                  onRetry: provider.loadAppData,
                ),
                const SizedBox(height: 16),
              ],
              _PayoutStateCard(payout: data.payoutState),
              const SizedBox(height: 16),
              _FraudCard(assessment: data.fraudAssessment),
              const SizedBox(height: 16),
              if (provider.latestSupportTicket != null) ...[
                _SupportTicketCard(ticket: provider.latestSupportTicket!),
                const SizedBox(height: 16),
              ],
              if (data.verificationSignals.isNotEmpty) _VerificationCard(signals: data.verificationSignals),
              if (data.verificationSignals.isNotEmpty) const SizedBox(height: 16),
              Text('Timeline', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (timelineSections.isEmpty)
                const _EmptyState(
                  title: 'No claims activity yet',
                  body: 'When a trigger hits or a premium posts, it will appear here.',
                  actionLabel: '',
                  onAction: null,
                )
              else
                ...timelineSections.map((section) => _TimelineSection(section: section)),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineSectionData {
  const _TimelineSectionData({
    required this.title,
    required this.entries,
  });

  final String title;
  final List<_TimelineEntry> entries;
}

List<_TimelineSectionData> _buildTimelineSections(AppData data) {
  final payoutEntries = data.payoutHistory.map((item) => _TimelineEntry(item: item, isPayout: true)).toList();
  final premiumEntries = data.premiumHistory.map((item) => _TimelineEntry(item: item, isPayout: false)).toList();
  final sections = <_TimelineSectionData>[];

  if (payoutEntries.isNotEmpty) {
    sections.add(_TimelineSectionData(title: 'Payouts', entries: payoutEntries));
  }

  if (premiumEntries.isNotEmpty) {
    sections.add(_TimelineSectionData(title: 'Premiums', entries: premiumEntries));
  }

  return sections;
}

class _TimelineEntry {
  _TimelineEntry({
    required this.item,
    required this.isPayout,
  });

  final PayoutItem item;
  final bool isPayout;
}

class _TimelineSection extends StatelessWidget {
  const _TimelineSection({required this.section});

  final _TimelineSectionData section;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(section.title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          ...section.entries.map((entry) => _TimelineCard(entry: entry)),
        ],
      ),
    );
  }
}

class _PayoutStateCard extends StatelessWidget {
  const _PayoutStateCard({required this.payout});

  final PayoutState payout;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Current payout', style: Theme.of(context).textTheme.titleLarge),
              _Pill(label: payout.status, tone: _toneForStatus(payout.status)),
            ],
          ),
          const SizedBox(height: 12),
          Text('₹${payout.amount}', style: Theme.of(context).textTheme.displayMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text('Ref ${payout.reference.isEmpty ? 'pending' : payout.reference}', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('Provider ${payout.provider} · Rail ${payout.rail} · ETA ${payout.etaMinutes} min', style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }

  Color _toneForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppTheme.green;
      case 'processing':
        return AppTheme.gold;
      case 'manual_review':
      case 'failed':
        return AppTheme.red;
      default:
        return AppTheme.skyBlue;
    }
  }
}

class _FraudCard extends StatelessWidget {
  const _FraudCard({required this.assessment});

  final FraudAssessment assessment;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Fraud assessment', style: Theme.of(context).textTheme.titleLarge),
              _Pill(label: assessment.status, tone: assessment.status == 'review' ? AppTheme.red : AppTheme.green),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${assessment.score}', style: Theme.of(context).textTheme.displayMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(width: 12),
              Expanded(child: Text(assessment.summary, style: Theme.of(context).textTheme.bodyMedium)),
            ],
          ),
          if (assessment.signals.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...assessment.signals.map(
              (signal) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLow,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(signal.label, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(signal.reason, style: Theme.of(context).textTheme.labelLarge),
                          ],
                        ),
                      ),
                      Text('${signal.score}', style: Theme.of(context).textTheme.titleLarge),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _VerificationCard extends StatelessWidget {
  const _VerificationCard({required this.signals});

  final List<String> signals;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Verification signals', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: signals
                .map(
                  (signal) => Chip(
                    label: Text(signal),
                    backgroundColor: AppTheme.surfaceLow,
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.entry});

  final _TimelineEntry entry;

  @override
  Widget build(BuildContext context) {
    final color = entry.isPayout ? AppTheme.green : AppTheme.navy;
    final sign = entry.isPayout ? '+' : '-';
    final receiptLines = [
      'Type: ${entry.isPayout ? 'Payout' : 'Premium'}',
      'Label: ${entry.item.label}',
      'Amount: ₹${entry.item.amount}',
      'Status: ${entry.item.status}',
      'Date: ${entry.item.date}',
    ].join('\n');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.item.label, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text('${entry.item.status} • ${entry.item.date}', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _Pill(label: entry.isPayout ? 'Payout' : 'Premium', tone: color),
                    _Pill(label: entry.item.type, tone: AppTheme.skyBlue),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$sign₹${entry.item.amount}',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: receiptLines));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Receipt copied')),
                  );
                },
                child: const Text('Copy'),
              ),
            ],
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
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.support_agent_rounded, color: AppTheme.navy),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Support ticket ${ticket.ticketId}', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text(ticket.message, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          _Pill(label: ticket.status, tone: AppTheme.skyBlue),
        ],
      ),
    );
  }
}

class _StaleBanner extends StatelessWidget {
  const _StaleBanner({
    required this.message,
    required this.onRetry,
  });

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

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.tone});

  final String label;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: tone, fontWeight: FontWeight.w700)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.body,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String body;
  final String actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.receipt_long_rounded, size: 44, color: AppTheme.navy),
          const SizedBox(height: 12),
          Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(body, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
          if (onAction != null && actionLabel.isNotEmpty) ...[
            const SizedBox(height: 14),
            ElevatedButton(onPressed: onAction, child: Text(actionLabel)),
          ],
        ],
      ),
    );
  }
}
