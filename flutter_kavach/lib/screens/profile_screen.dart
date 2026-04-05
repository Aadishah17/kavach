import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/app_data.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
                title: 'Profile unavailable',
                body: provider.errorMessage ?? 'Sign in to see your worker profile and preferences.',
                actionLabel: 'Retry',
                onAction: provider.isAuthenticated ? () => provider.loadAppData() : null,
              ),
            ),
          ),
        ),
      );
    }

    final settings = data.profileSettings;
    final smartAlerts = settings['smartAlerts'] as bool? ?? false;
    final biometricLock = settings['biometricLock'] as bool? ?? false;
    final language = settings['language']?.toString() ?? 'English';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (provider.hasStaleData) ...[
              _StaleBanner(
                message: provider.errorMessage ?? 'Showing your last synced profile bundle.',
                onRetry: provider.loadAppData,
              ),
              const SizedBox(height: 16),
            ],
            _ProfileHeader(name: data.userName, platform: data.platform, zone: data.zone),
            const SizedBox(height: 16),
            _SummaryCard(data: data),
            const SizedBox(height: 16),
            Text('Linked documents', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 12),
            if (data.profileDocuments.isEmpty)
              const _EmptyInline(title: 'No documents synced', body: 'Your backend profile bundle did not include document records.')
            else
              ...data.profileDocuments.map((document) => _DocumentCard(document: document)),
            const SizedBox(height: 16),
            Text('Preferences', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 12),
            _PreferenceCard(
              title: 'Smart alerts',
              subtitle: smartAlerts ? 'Enabled for live risk updates' : 'Disabled',
              value: smartAlerts,
            ),
            const SizedBox(height: 10),
            _PreferenceCard(
              title: 'Biometric lock',
              subtitle: biometricLock ? 'Enabled on this device' : 'Disabled',
              value: biometricLock,
            ),
            const SizedBox(height: 10),
            _PreferenceCard(
              title: 'Language',
              subtitle: language,
              value: true,
            ),
            const SizedBox(height: 16),
            _SupportAndSignOut(provider: provider),
          ],
        ),
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

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.name,
    required this.platform,
    required this.zone,
  });

  final String name;
  final String platform;
  final String zone;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const CircleAvatar(
          radius: 34,
          backgroundColor: AppTheme.navy,
          child: Icon(Icons.person_rounded, color: Colors.white, size: 34),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text('$platform · $zone', style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.data});

  final AppData data;

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
        children: [
          Row(
            children: [
              Expanded(
                child: _SummaryItem(label: 'Plan', value: data.plan),
              ),
              Expanded(
                child: _SummaryItem(label: 'Weekly income', value: '₹${data.insuredIncome}'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _SummaryItem(label: 'Coverage', value: data.coverageStatus),
              ),
              Expanded(
                child: _SummaryItem(
                  label: 'Monthly protected',
                  value: data.monthlyProtectedAmount > 0 ? '₹${data.monthlyProtectedAmount}' : 'Unavailable',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  const _SummaryItem({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 4),
        Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document});

  final ProfileDocument document;

  @override
  Widget build(BuildContext context) {
    final verified = document.verified;
    final tone = verified ? AppTheme.green : AppTheme.skyBlue;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: tone.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(_iconFor(document.icon), color: tone, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(document.label, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(document.status, style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          if (verified) const Icon(Icons.verified_rounded, color: AppTheme.green),
        ],
      ),
    );
  }

  IconData _iconFor(String icon) {
    switch (icon) {
      case 'article':
        return Icons.article_rounded;
      case 'drive':
        return Icons.drive_eta_rounded;
      default:
        return Icons.description_rounded;
    }
  }
}

class _PreferenceCard extends StatelessWidget {
  const _PreferenceCard({
    required this.title,
    required this.subtitle,
    required this.value,
  });

  final String title;
  final String subtitle;
  final bool value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
          Icon(value ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: value ? AppTheme.green : AppTheme.textSecondary),
        ],
      ),
    );
  }
}

class _SupportAndSignOut extends StatelessWidget {
  const _SupportAndSignOut({required this.provider});

  final AppProvider provider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () async {
              final ticket = await provider.requestEmergencySupport(channel: 'phone');
              if (!context.mounted || ticket == null) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Support ${ticket.ticketId} queued')),
              );
            },
            icon: const Icon(Icons.support_agent_rounded),
            label: const Text('Request support'),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.red),
              foregroundColor: AppTheme.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () => provider.logout(),
            child: const Text('Sign out'),
          ),
        ),
      ],
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
          const Icon(Icons.person_outline_rounded, size: 44, color: AppTheme.navy),
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

class _EmptyInline extends StatelessWidget {
  const _EmptyInline({
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
