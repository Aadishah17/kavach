import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/app_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_layout.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()..restoreSession()),
      ],
      child: const KavachApp(),
    ),
  );
}

class KavachApp extends StatelessWidget {
  const KavachApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kavach',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      onGenerateRoute: (settings) {
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => AuthGate(targetRoute: settings.name ?? '/'),
        );
      },
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({
    super.key,
    required this.targetRoute,
  });

  final String targetRoute;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    if (provider.isBooting) {
      return Scaffold(
        backgroundColor: AppTheme.navy,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shield_rounded, size: 64, color: AppTheme.gold),
              const SizedBox(height: 24),
              Text(
                'Kavach',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: Colors.white,
                      fontSize: 36,
                    ),
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(color: AppTheme.gold),
            ],
          ),
        ),
      );
    }

    if (provider.isAuthenticated) {
      return MainLayout(initialIndex: _tabIndexForRoute(targetRoute));
    }

    return const LoginScreen();
  }
}

int _tabIndexForRoute(String route) {
  final path = route.split('?').first;
  switch (path) {
    case '/claims':
      return 1;
    case '/alerts':
    case '/support':
      return 2;
    case '/profile':
      return 3;
    case '/':
    case '/home':
    default:
      return 0;
  }
}
