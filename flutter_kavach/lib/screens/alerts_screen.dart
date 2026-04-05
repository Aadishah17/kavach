import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/app_data.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;

    if (provider.dataState == AppDataState.loading) {
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
              _BuildSupportCard(
                onEmergencySupport: () async {
                  final ticket = await provider.requestEmergencySupport(channel: 'callback');
                  if (!context.mounted || ticket == null) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Support ${ticket.ticketId} queued')),
                  );
                },
                lastTicket: provider.lastSupportTicket,
              ),
              const SizedBox(height: 16),
              Text('Notification feed', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (data.alertsFeed.isEmpty)
                _EmptySection(title: 'No recent alerts', body: 'The app will show payout, weather, and support updates here.')
              else
                ...data.alertsFeed.map((item) => _FeedCard(item: item)),
              const SizedBox(height: 16),
              Text('Emergency resources', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (data.emergencyResources.isEmpty)
                _EmptySection(title: 'No emergency resources', body: 'Support resources will appear here when the backend returns them.')
              else
                ...data.emergencyResources.map((resource) => _ResourceCard(resource: resource)),
              const SizedBox(height: 16),
              Text('Support contacts', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (data.supportContacts.isEmpty)
                _EmptySection(title: 'No contacts linked', body: 'Worker support contacts are loaded from your profile bundle.')
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
  });

  final Future<void> Function() onEmergencySupport;
  final SupportTicket? lastTicket;

  @override
  Widget build(BuildContext context) {
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
          ElevatedButton.icon(
            onPressed: onEmergencySupport,
            icon: const Icon(Icons.support_agent_rounded),
            label: const Text('Request callback'),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.gold, foregroundColor: AppTheme.navy),
          ),
          if (lastTicket != null) ...[
            const SizedBox(height: 10),
            Text(
              'Last ticket ${lastTicket!.ticketId} · ${lastTicket!.status}',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white70),
            ),
          ],
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
        color: AppTheme.surfaceLowest,
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
                Text(item.title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(item.body, style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          if (item.time.isNotEmpty) Text(item.time, style: Theme.of(context).textTheme.labelMedium),
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
