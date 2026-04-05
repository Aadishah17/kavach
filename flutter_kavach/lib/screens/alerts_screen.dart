import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/app_data.dart';
import '../providers/app_provider.dart';
import '../services/app_data_cache.dart';
import '../theme/app_theme.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

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
                title: 'Alerts unavailable',
                body: provider.errorMessage ?? 'Sign in to see notifications and emergency resources.',
                actionLabel: 'Retry',
                onAction: provider.isAuthenticated ? () => provider.loadAppData() : null,
              ),
            ),
          ),
        ),
      );
    }

    final groupedFeed = _groupFeedItems(data.alertsFeed);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Alerts & support'),
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
                  message: provider.errorMessage ?? 'Showing your last synced alert bundle while connectivity recovers.',
                  onRetry: provider.loadAppData,
                ),
                const SizedBox(height: 16),
              ],
              _BuildSupportCard(
                onEmergencySupport: () async {
                  final ticket = await provider.requestEmergencySupport(channel: 'callback');
                  if (!context.mounted || ticket == null) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Support ${ticket.ticketId} queued')),
                  );
                },
                onCopyLatestReceipt: provider.latestSupportTicket == null
                    ? null
                    : () => _copyReceipt(
                          context,
                          provider.supportTicketHistory.first,
                        ),
                lastTicket: provider.latestSupportTicket,
                history: provider.supportTicketHistory,
              ),
              const SizedBox(height: 16),
              Text('Notification feed', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (groupedFeed.isEmpty)
                const _EmptySection(
                  title: 'No recent alerts',
                  body: 'The app will show payout, weather, and support updates here.',
                )
              else
                ...groupedFeed.map((group) => _FeedGroupCard(group: group)),
              const SizedBox(height: 16),
              Text('Emergency resources', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (data.emergencyResources.isEmpty)
                const _EmptySection(
                  title: 'No emergency resources',
                  body: 'Support resources will appear here when the backend returns them.',
                )
              else
                ...data.emergencyResources.map((resource) => _ResourceCard(resource: resource)),
              const SizedBox(height: 16),
              Text('Support contacts', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (data.supportContacts.isEmpty)
                const _EmptySection(
                  title: 'No contacts linked',
                  body: 'Worker support contacts are loaded from your profile bundle.',
                )
              else
                ...data.supportContacts.map((contact) => _ContactCard(contact: contact)),
            ],
          ),
        ),
      ),
    );
  }
}

class _BuildSupportCard extends StatelessWidget {
  const _BuildSupportCard({
    required this.onEmergencySupport,
    required this.lastTicket,
    required this.history,
    required this.onCopyLatestReceipt,
  });

  final Future<void> Function() onEmergencySupport;
  final SupportTicket? lastTicket;
  final List<SupportTicketRecord> history;
  final VoidCallback? onCopyLatestReceipt;

  @override
  Widget build(BuildContext context) {
    final statusText = lastTicket == null ? 'No tickets yet' : '${lastTicket!.ticketId} · ${lastTicket!.status}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.navy, Color(0xFF002F5F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Emergency support', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)),
          const SizedBox(height: 8),
          Text(
            'Trigger a callback from the worker support desk if you need help now.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70, height: 1.45),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onEmergencySupport,
                  icon: const Icon(Icons.support_agent_rounded),
                  label: const Text('Request callback'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.gold, foregroundColor: AppTheme.navy),
                ),
              ),
              if (onCopyLatestReceipt != null) ...[
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: onCopyLatestReceipt,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                  ),
                  child: const Text('Copy receipt'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          Text(statusText, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white70)),
          if (history.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Recent tickets (${history.length})',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: history
                  .take(3)
                  .map(
                    (ticket) => _TicketChip(
                      label: ticket.ticket.ticketId,
                      subtitle: ticket.ticket.status,
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }
}

class _FeedGroup {
  const _FeedGroup({
    required this.title,
    required this.items,
    required this.icon,
  });

  final String title;
  final List<AlertFeedItem> items;
  final IconData icon;
}

class _FeedGroupCard extends StatelessWidget {
  const _FeedGroupCard({required this.group});

  final _FeedGroup group;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(group.icon, size: 18, color: AppTheme.navy),
              const SizedBox(width: 8),
              Text(group.title, style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              Text('${group.items.length}', style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
          const SizedBox(height: 12),
          ...group.items.map((item) => _FeedCard(item: item)),
        ],
      ),
    );
  }
}

class _FeedCard extends StatelessWidget {
  const _FeedCard({required this.item});

  final AlertFeedItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _accent(item.accent).withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(_iconFor(item.icon), color: _accent(item.accent), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(item.title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                    ),
                    if (item.status.isNotEmpty)
                      _StatusChip(label: item.status, tone: _accent(item.accent)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(item.body, style: Theme.of(context).textTheme.labelLarge),
                if (item.time.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(item.time, style: Theme.of(context).textTheme.labelMedium),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(String icon) {
    switch (icon) {
      case 'wallet':
        return Icons.account_balance_wallet_rounded;
      case 'shield':
        return Icons.verified_user_rounded;
      case 'phone':
        return Icons.phone_rounded;
      case 'cloud':
        return Icons.cloud_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _accent(String accent) {
    switch (accent) {
      case 'green':
        return AppTheme.green;
      case 'gold':
        return AppTheme.gold;
      case 'red':
        return AppTheme.red;
      default:
        return AppTheme.skyBlue;
    }
  }
}

class _TicketChip extends StatelessWidget {
  const _TicketChip({
    required this.label,
    required this.subtitle,
  });

  final String label;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white)),
          const SizedBox(height: 2),
          Text(subtitle, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.tone,
  });

  final String label;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: tone,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _ResourceCard extends StatelessWidget {
  const _ResourceCard({required this.resource});

  final EmergencyResource resource;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(resource.label, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
          if (resource.description.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(resource.description, style: Theme.of(context).textTheme.labelLarge),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Text(resource.number, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.navy)),
              const Spacer(),
              Text(resource.cta, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppTheme.skyBlue)),
            ],
          ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.contact});

  final SupportContact contact;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppTheme.skyBlue.withValues(alpha: 0.14),
            child: Text(contact.initials, style: const TextStyle(color: AppTheme.skyBlue, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(contact.name, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(contact.relation, style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          Text(contact.phone, style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.navy, fontWeight: FontWeight.w700)),
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

void _copyReceipt(BuildContext context, SupportTicketRecord record) {
  final receipt = [
    'Ticket ${record.ticket.ticketId}',
    'Status: ${record.ticket.status}',
    'Channel: ${record.channel}',
    'Requested: ${record.requestedAt}',
    'Note: ${record.ticket.message}',
  ].join('\n');

  Clipboard.setData(ClipboardData(text: receipt));
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Support receipt copied')),
  );
}

List<_FeedGroup> _groupFeedItems(List<AlertFeedItem> items) {
  final grouped = <String, List<AlertFeedItem>>{};

  for (final item in items) {
    final key = _feedGroupKey(item);
    grouped.putIfAbsent(key.label, () => <AlertFeedItem>[]).add(item);
  }

  return grouped.entries
      .map(
        (entry) => _FeedGroup(
          title: entry.key,
          items: entry.value,
          icon: _feedGroupKey(entry.value.first).icon,
        ),
      )
      .toList(growable: false);
}

({String label, IconData icon}) _feedGroupKey(AlertFeedItem item) {
  final status = item.status.toLowerCase();
  final icon = item.icon.toLowerCase();
  final body = '${item.title} ${item.body}'.toLowerCase();

  if (icon.contains('cloud') || body.contains('weather') || body.contains('rain')) {
    return (label: 'Weather updates', icon: Icons.cloud_rounded);
  }

  if (icon.contains('wallet') || status.contains('paid') || body.contains('payout')) {
    return (label: 'Payout updates', icon: Icons.account_balance_wallet_rounded);
  }

  if (icon.contains('phone') || body.contains('support')) {
    return (label: 'Support updates', icon: Icons.support_agent_rounded);
  }

  return (label: 'General alerts', icon: Icons.notifications_rounded);
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
          const Icon(Icons.notifications_none_rounded, size: 44, color: AppTheme.navy),
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

class _EmptySection extends StatelessWidget {
  const _EmptySection({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(body, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
