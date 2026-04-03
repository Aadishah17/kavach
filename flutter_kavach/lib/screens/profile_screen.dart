import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../providers/app_provider.dart';
import 'package:provider/provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _smartAlerts = true;
  bool _biometric = true;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final data = provider.appData;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileHeader(context, data?.userName ?? 'Rajesh K.', data?.platform ?? 'Swiggy Pilot'),
            const SizedBox(height: 32),
            Text('Linked Documents', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            _buildLinkedDocuments(context),
            const SizedBox(height: 32),
            Text('Settings', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            _buildSettings(context),
            const SizedBox(height: 48),
            _buildSignOutButton(context),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, String name, String subtitle) {
    return Row(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: AppTheme.surfaceLow,
          child: const Icon(Icons.person, size: 40, color: AppTheme.navy),
        ),
        const SizedBox(width: 20),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.skyBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(subtitle, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppTheme.skyBlue)),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildLinkedDocuments(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          _buildDocItem('Aadhaar Card', 'Verified', Icons.article_rounded, AppTheme.green, true),
          Divider(height: 1, color: AppTheme.outlineVariant.withValues(alpha: 0.2)),
          _buildDocItem('Driving License', 'Active', Icons.drive_eta_rounded, AppTheme.skyBlue, false),
        ],
      ),
    );
  }

  Widget _buildDocItem(String title, String status, IconData icon, Color statusColor, bool isVerified) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.surfaceLow, shape: BoxShape.circle),
            child: Icon(icon, color: AppTheme.navy, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    if (isVerified) const Icon(Icons.verified, size: 14, color: AppTheme.green),
                    if (isVerified) const SizedBox(width: 4),
                    Text(status, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: statusColor)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettings(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          SwitchListTile(
            title: Text('Smart Alerts', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
            subtitle: Text('Notify me during peak hours', style: Theme.of(context).textTheme.labelMedium),
            value: _smartAlerts,
            onChanged: (v) => setState(() => _smartAlerts = v),
            activeThumbColor: AppTheme.skyBlue,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
          Divider(height: 1, color: AppTheme.outlineVariant.withValues(alpha: 0.2)),
          ListTile(
            title: Text('App Language', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
            subtitle: Text('English', style: Theme.of(context).textTheme.labelMedium),
            trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            onTap: () {},
          ),
          Divider(height: 1, color: AppTheme.outlineVariant.withValues(alpha: 0.2)),
          SwitchListTile(
            title: Text('Biometric Lock', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
            subtitle: Text('Face ID enabled', style: Theme.of(context).textTheme.labelMedium),
            value: _biometric,
            onChanged: (v) => setState(() => _biometric = v),
            activeThumbColor: AppTheme.skyBlue,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppTheme.red),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: () {},
        child: Text('Sign Out', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.red)),
      ),
    );
  }
}
