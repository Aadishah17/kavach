import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;
  bool _isLoggingIn = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeIn = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleDemoLogin() async {
    setState(() => _isLoggingIn = true);
    await context.read<AppProvider>().demoLogin();
    if (mounted) {
      setState(() => _isLoggingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.navy,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeIn,
          child: SlideTransition(
            position: _slideUp,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const Spacer(flex: 2),
                  // Shield icon
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.gold.withValues(alpha: 0.3),
                          AppTheme.gold.withValues(alpha: 0.1),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.shield_rounded,
                      size: 52,
                      color: AppTheme.gold,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Title
                  Text(
                    'Kavach',
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(
                          color: Colors.white,
                          fontSize: 42,
                          letterSpacing: 1.5,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Parametric Income Protection\nfor India\'s Gig Workers',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.white60,
                          height: 1.5,
                        ),
                  ),
                  const Spacer(flex: 2),
                  // Feature chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      _buildChip('🌧️ Weather Triggers'),
                      _buildChip('⚡ < 4 Min Payouts'),
                      _buildChip('🛡️ AI Trust Score'),
                      _buildChip('₹29/week Plans'),
                    ],
                  ),
                  const SizedBox(height: 40),
                  // Demo login button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoggingIn ? null : _handleDemoLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.gold,
                        foregroundColor: AppTheme.navy,
                        disabledBackgroundColor: AppTheme.gold.withValues(alpha: 0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoggingIn
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: AppTheme.navy,
                              ),
                            )
                          : Text(
                              'Demo Login',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: AppTheme.navy,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Explore with a pre-loaded demo account',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: Colors.white38,
                        ),
                  ),
                  const Spacer(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white70,
              fontSize: 13,
            ),
      ),
    );
  }
}
