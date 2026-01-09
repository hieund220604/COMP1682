import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/config/theme/app_theme.dart';
import 'package:splitpay/core/network/dio_client.dart';
import 'package:splitpay/core/storage/token_storage.dart';
import 'package:splitpay/core/widgets/main_shell.dart';
import 'package:splitpay/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:splitpay/features/auth/data/repositories/auth_repository.dart';
import 'package:splitpay/features/auth/presentation/pages/login_page.dart';
import 'package:splitpay/features/auth/presentation/providers/auth_provider.dart';
import 'package:splitpay/features/group/data/datasources/group_remote_data_source.dart';
import 'package:splitpay/features/group/data/repositories/group_repository.dart';
import 'package:splitpay/features/group/presentation/providers/group_provider.dart';
import 'package:splitpay/features/auth/presentation/pages/welcome_page.dart';

import 'package:splitpay/core/constants/app_keys.dart';
import 'package:splitpay/core/providers/theme_provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize dependencies
    final tokenStorage = TokenStorage();
    final dioClient = DioClient(tokenStorage: tokenStorage);
    final authDataSource = AuthRemoteDataSource(dioClient.dio);
    final authRepository = AuthRepository(authDataSource);

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            repository: authRepository,
            tokenStorage: tokenStorage,
          )..checkAuthStatus(), // Check auth on app start
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            scaffoldMessengerKey: rootScaffoldMessengerKey,
            title: 'SplitPal',
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            debugShowCheckedModeBanner: false,
            // Configure named routes
            initialRoute: '/',
            routes: {
              '/': (context) => const AuthWrapper(),
            },
          );
        },
      ),
    );
  }
}

// Wrapper to decide which screen to show based on auth status
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (authProvider.status == AuthStatus.loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.isAuthenticated) {
          // Show WelcomePage every time the user is authenticated
          return const WelcomePage();
        }

        return const LoginPage();
      },
    );
  }
}
