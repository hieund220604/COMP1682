import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/core/network/dio_client.dart';
import 'package:splitpay/core/storage/token_storage.dart';
import 'package:splitpay/core/widgets/main_shell.dart';
import 'package:splitpay/features/auth/presentation/providers/auth_provider.dart';
import 'package:splitpay/features/group/data/datasources/group_remote_data_source.dart';
import 'package:splitpay/features/group/data/repositories/group_repository.dart';
import 'package:splitpay/features/group/presentation/providers/group_provider.dart';

class AuthorizedAppShell extends StatelessWidget {
  const AuthorizedAppShell({super.key});

  @override
  Widget build(BuildContext context) {
    // Access auth provider to get the token
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // Create GroupProvider with authenticated token
    final tokenStorage = TokenStorage();
    final dioClient = DioClient(tokenStorage: tokenStorage);
    final groupDataSource = GroupRemoteDataSource(
      dioClient.dio,
      authProvider.token ?? '',
    );
    final groupRepository = GroupRepository(groupDataSource);

    return ChangeNotifierProvider(
      create: (_) => GroupProvider(repository: groupRepository)..fetchGroups(),
      child: const MainShell(),
    );
  }
}
