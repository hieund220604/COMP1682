import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/config/theme/app_theme.dart';
import 'package:splitpay/core/network/dio_client.dart';
import 'package:splitpay/core/storage/token_storage.dart';
import 'package:splitpay/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:splitpay/features/auth/data/repositories/auth_repository.dart';
import 'package:splitpay/features/auth/presentation/pages/login_page.dart';
import 'package:splitpay/features/auth/presentation/providers/auth_provider.dart';

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
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            repository: authRepository,
            tokenStorage: tokenStorage,
          )..checkAuthStatus(), // Check auth on app start
        ),
      ],
      child: MaterialApp(
        title: 'SplitPay',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const AuthWrapper(),
        debugShowCheckedModeBanner: false,
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
          // TODO: Navigate to Dashboard/Home
          return Scaffold(
            appBar: AppBar(title: const Text('Dashboard')),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Welcome, ${authProvider.user?.displayName ?? 'User'}!'),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => authProvider.logout(),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
          );
        }

        return const LoginPage();
      },
    );
  }
}
