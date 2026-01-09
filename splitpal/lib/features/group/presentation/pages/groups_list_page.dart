import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/features/group/data/models/group_models.dart';
import 'package:splitpay/features/group/presentation/providers/group_provider.dart';
import 'package:splitpay/features/group/presentation/pages/create_group_page.dart';
import 'package:splitpay/features/group/presentation/pages/group_detail_page.dart';
import 'package:splitpay/features/group/presentation/pages/accept_invite_page.dart';

class GroupsListPage extends StatefulWidget {
  const GroupsListPage({super.key});

  @override
  State<GroupsListPage> createState() => _GroupsListPageState();
}

class _GroupsListPageState extends State<GroupsListPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<GroupProvider>();
      provider.fetchGroups();
      provider.fetchPendingInvites();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6F6),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchBar(),
            Expanded(child: _buildGroupsList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Icon(Icons.menu, color: Colors.grey),
          ),
          const Text(
            'Groups List',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF181111),
            ),
          ),
          const CircleAvatar(
            radius: 20,
            backgroundColor: Color(0xFFE74C3C),
            child: Icon(Icons.person, color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
            ),
          ],
        ),
        child: TextField(
          decoration: InputDecoration(
            hintText: 'Search groups...',
            hintStyle: TextStyle(color: Colors.grey[400]),
            prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ),
    );
  }

  Widget _buildGroupsList() {
    return Consumer<GroupProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.groups.isEmpty) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFFE74C3C)));
        }

        if (provider.errorMessage != null && provider.groups.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  provider.errorMessage!,
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => provider.fetchGroups(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        if (provider.groups.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            provider.fetchGroups();
            provider.fetchPendingInvites();
          },
          color: const Color(0xFFE74C3C),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Pending Invites Section
              if (provider.pendingInvites.isNotEmpty) ...[
                const Text(
                  'Pending Invitations',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF181111),
                  ),
                ),
                const SizedBox(height: 12),
                ...provider.pendingInvites.map((invite) => _buildPendingInviteCard(invite)),
                const SizedBox(height: 24),
                const Text(
                  'My Groups',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF181111),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Groups List
              if (provider.groups.isEmpty && provider.pendingInvites.isEmpty)
                 _buildEmptyState()
              else ...[
                 ...provider.groups.map((group) => _buildGroupCard(group)),
                 _buildJoinGroupCard(),
              ]
            ],
          ),
        );
      },
    );
  }

  Widget _buildPendingInviteCard(InviteModel invite) {
    return GestureDetector(
      onTap: () => _navigateToAcceptInvite(invite),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE74C3C).withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFE74C3C).withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFE74C3C).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.mail_outline,
                  color: Color(0xFFE74C3C),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Invitation to Join',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      invite.groupName ?? 'Unknown Group',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF181111),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE74C3C),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Review',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToAcceptInvite(InviteModel invite) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => ChangeNotifierProvider.value(
          value: Provider.of<GroupProvider>(context, listen: false),
          child: AcceptInvitePage(
            token: invite.token ?? '',
            groupName: invite.groupName,
          ),
        ),
      ),
    );

    if (result == true) {
      // Refresh fetches if invite was accepted
      final provider = Provider.of<GroupProvider>(context, listen: false);
      provider.fetchGroups();
      provider.fetchPendingInvites();
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.group_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No groups yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a new group or join one via code',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupCard(GroupModel group) {
    return GestureDetector(
      onTap: () => _navigateToGroupDetail(group),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFE74C3C).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.group,
                  color: Color(0xFFE74C3C),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      group.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF181111),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.group_outlined, size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          '${group.memberCount ?? 0} members',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  group.baseCurrency,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinGroupCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 80),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid, width: 2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.add, color: Colors.grey[400]),
          ),
          const SizedBox(height: 8),
          Text(
            'Join group via code',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToCreateGroup() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => ChangeNotifierProvider.value(
          value: Provider.of<GroupProvider>(context, listen: false),
          child: const CreateGroupPage(),
        ),
      ),
    );
  }

  void _navigateToGroupDetail(GroupModel group) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => ChangeNotifierProvider.value(
          value: Provider.of<GroupProvider>(context, listen: false),
          child: GroupDetailPage(groupId: group.id),
        ),
      ),
    );
  }
}
