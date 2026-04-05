import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _submitPhoneLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await context.read<AppProvider>().loginWithPhone(_phoneController.text.trim());
  }

  Future<void> _submitOtpLogin() async {
    if (_otpController.text.trim().isEmpty) {
      return;
    }

    await context.read<AppProvider>().submitOtp(_otpController.text.trim());
  }

  Future<void> _submitDemoLogin() async {
    await context.read<AppProvider>().demoLogin();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final isBusy = provider.authState == AppAuthState.authenticating;
    final needsOtp = provider.loginStage == AppLoginStage.otp;

    return Scaffold(
      backgroundColor: AppTheme.navy,
      body: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.navy, Color(0xFF0B2F4A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.gold.withValues(alpha: 0.35)),
                    color: Colors.white.withValues(alpha: 0.04),
                  ),
                  child: const Icon(
                    Icons.shield_rounded,
                    size: 42,
                    color: AppTheme.gold,
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  'Log in to Kavach',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        color: Colors.white,
                        fontSize: 34,
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Track active coverage, instant payouts, fraud trust signals, and emergency support from the same worker account you use on the live website.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 28),
                _buildSignalStrip(context),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 28,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Returning worker',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          needsOtp
                              ? 'A verification code was requested for ${provider.pendingPhoneNumber ?? 'your account'}.'
                              : 'Enter the phone number you used during signup.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                        ),
                        const SizedBox(height: 18),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          enabled: !needsOtp,
                          decoration: InputDecoration(
                            labelText: 'Phone number',
                            hintText: '+91 9988776655',
                            prefixIcon: const Icon(Icons.phone_android_rounded),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          validator: (value) {
                            final text = value?.trim() ?? '';
                            if (text.length < 6) {
                              return 'Enter the registered phone number.';
                            }
                            return null;
                          },
                          onFieldSubmitted: (_) => needsOtp ? _submitOtpLogin() : _submitPhoneLogin(),
                        ),
                        if (needsOtp) ...[
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'OTP code',
                              hintText: '123456',
                              prefixIcon: const Icon(Icons.password_rounded),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            onFieldSubmitted: (_) => _submitOtpLogin(),
                          ),
                        ],
                        if ((provider.errorMessage ?? '').isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.red.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              provider.errorMessage!,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.red,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 54,
                          child: ElevatedButton(
                            onPressed: isBusy ? null : (needsOtp ? _submitOtpLogin : _submitPhoneLogin),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.navy,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: isBusy
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(needsOtp ? 'Verify OTP' : 'Log in with phone'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton(
                            onPressed: isBusy ? null : _submitDemoLogin,
                            child: const Text('Open admin demo instead'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSignalStrip(BuildContext context) {
    final items = const [
      ('Payouts', Icons.account_balance_wallet_rounded),
      ('Fraud shield', Icons.shield_outlined),
      ('Weather watch', Icons.wb_cloudy_outlined),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: items
          .map(
            (item) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white.withValues(alpha: 0.08),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(item.$2, size: 16, color: AppTheme.gold),
                  const SizedBox(width: 8),
                  Text(
                    item.$1,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Colors.white70,
                        ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
