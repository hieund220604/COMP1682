import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/features/group/data/models/group_models.dart';
import 'package:splitpay/features/group/presentation/providers/group_provider.dart';
import 'package:splitpay/features/group/presentation/pages/invite_member_page.dart';

class GroupDetailPage extends StatefulWidget {
  final String groupId;

  const GroupDetailPage({super.key, required this.groupId});

  @override
  State<GroupDetailPage> createState() => _GroupDetailPageState();
}

class _GroupDetailPageState extends State<GroupDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<GroupProvider>();
      provider.fetchGroupById(widget.groupId);
      provider.fetchMembers(widget.groupId);
      provider.fetchBalance(widget.groupId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Consumer<GroupProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.currentGroup == null) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFE74C3C)),
            );
          }

          final group = provider.currentGroup;
          if (group == null) {
            return const Center(child: Text('Group not found'));
          }

          return CustomScrollView(
            slivers: [
              _buildAppBar(group),
              SliverToBoxAdapter(child: _buildQuickActions()),
              SliverToBoxAdapter(child: _buildMembersSection(provider)),
              SliverToBoxAdapter(child: _buildBalanceSection(provider)),
              SliverToBoxAdapter(child: _buildSettingsSection(provider, group)),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAppBar(GroupModel group) {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Color(0xFF181111)),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.settings_outlined, color: Color(0xFF181111)),
          onPressed: () {
            // TODO: Navigate to settings
          },
        ),
      ],
      expandedHeight: 120,
      flexibleSpace: FlexibleSpaceBar(
        background: Padding(
          padding: const EdgeInsets.fromLTRB(16, 80, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                group.name,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF181111),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${group.memberCount ?? 0} Members',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildActionButton(
              icon: Icons.person_add_outlined,
              label: 'Invite Member',
              bgColor: Colors.grey[50]!,
              iconColor: const Color(0xFFE74C3C),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (ctx) => ChangeNotifierProvider.value(
                      value: Provider.of<GroupProvider>(context, listen: false),
                      child: InviteMemberPage(groupId: widget.groupId),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildActionButton(
              icon: Icons.post_add,
              label: 'Add Expense',
              bgColor: const Color(0xFFE74C3C).withOpacity(0.05),
              iconColor: const Color(0xFFE74C3C),
              isPrimary: true,
              onTap: () {
                // TODO: Navigate to add expense
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color bgColor,
    required Color iconColor,
    bool isPrimary = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isPrimary ? const Color(0xFFE74C3C) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: isPrimary
                        ? const Color(0xFFE74C3C).withOpacity(0.3)
                        : Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: isPrimary ? Colors.white : iconColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMembersSection(GroupProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Members',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF181111),
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'View All',
                  style: TextStyle(color: Color(0xFFE74C3C)),
                ),
              ),
            ],
          ),
        ),
        ...provider.members.map((member) => _buildMemberTile(member)),
        const Divider(height: 32),
      ],
    );
  }

  Widget _buildMemberTile(GroupMemberModel member) {
    return ListTile(
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.grey[200],
            backgroundImage: member.user?.avatarUrl != null
                ? NetworkImage(member.user!.avatarUrl!)
                : null,
            child: member.user?.avatarUrl == null
                ? const Icon(Icons.person, color: Colors.grey)
                : null,
          ),
          if (member.role == GroupRole.owner)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.amber,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white, width: 1),
                ),
                child: const Text(
                  'OWNER',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ),
        ],
      ),
      title: Text(
        member.user?.displayName ?? member.user?.email ?? 'Unknown',
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: Text(
        member.user?.email ?? '',
        style: TextStyle(color: Colors.grey[500], fontSize: 13),
      ),
      trailing: IconButton(
        icon: Icon(Icons.more_vert, color: Colors.grey[400]),
        onPressed: () => _showMemberOptions(member),
      ),
    );
  }

  Widget _buildBalanceSection(GroupProvider provider) {
    if (provider.balance == null) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Group Balance',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF181111),
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...provider.balance!.members.map((b) => _buildBalanceCard(b)),
      ],
    );
  }

  Widget _buildBalanceCard(MemberBalanceModel balance) {
    final isPositive = balance.netBalance >= 0;
    final isZero = balance.netBalance == 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: Colors.grey[300],
                    child: const Icon(Icons.person, size: 14, color: Colors.grey),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    balance.displayName ?? 'User',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isZero
                      ? Colors.grey[100]
                      : isPositive
                          ? Colors.green[50]
                          : Colors.red[50],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isZero ? 'Paid' : isPositive ? 'Credit' : 'Debt',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isZero
                        ? Colors.grey[600]
                        : isPositive
                            ? Colors.green[700]
                            : const Color(0xFFE74C3C),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TOTAL SPENT',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[500],
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(
                    _formatCurrency(balance.totalLent),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'NET BALANCE',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[500],
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(
                    '${isPositive ? '+' : ''}${_formatCurrency(balance.netBalance)}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: isZero
                          ? Colors.grey[400]
                          : isPositive
                              ? Colors.green[600]
                              : const Color(0xFFE74C3C),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(GroupProvider provider, GroupModel group) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'GROUP SETTINGS',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey[400],
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingsButton(
            label: 'Update Group',
            icon: Icons.chevron_right,
            onTap: () {
              // TODO: Navigate to update group
            },
          ),
          const SizedBox(height: 12),
          _buildSettingsButton(
            label: 'Leave Group',
            icon: Icons.logout,
            isDestructive: true,
            outlined: true,
            onTap: () => _showLeaveConfirmation(provider),
          ),
          const SizedBox(height: 12),
          _buildSettingsButton(
            label: 'Delete Group',
            icon: Icons.delete_outline,
            isDestructive: true,
            onTap: () => _showDeleteConfirmation(provider),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsButton({
    required String label,
    required IconData icon,
    bool isDestructive = false,
    bool outlined = false,
    required VoidCallback onTap,
  }) {
    if (outlined) {
      return OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: BorderSide(color: const Color(0xFFE74C3C).withOpacity(0.2)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFFE74C3C), size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFFE74C3C),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }

    if (isDestructive) {
      return ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE74C3C),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        title: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        trailing: Icon(icon, color: Colors.grey[400]),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    )} đ';
  }

  void _showMemberOptions(GroupMemberModel member) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.admin_panel_settings),
              title: const Text('Change Role'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Show role picker
              },
            ),
            if (member.role != GroupRole.owner)
              ListTile(
                leading: const Icon(Icons.person_remove, color: Colors.red),
                title: const Text('Remove Member', style: TextStyle(color: Colors.red)),
                onTap: () async {
                  Navigator.pop(context);
                  final provider = context.read<GroupProvider>();
                  await provider.removeMember(widget.groupId, member.id);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showLeaveConfirmation(GroupProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Group'),
        content: const Text('Are you sure you want to leave this group?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await provider.leaveGroup(widget.groupId);
              if (success && mounted) {
                Navigator.pop(context);
              }
            },
            child: const Text('Leave', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(GroupProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Group'),
        content: const Text('This action cannot be undone. Are you sure?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await provider.deleteGroup(widget.groupId);
              if (success && mounted) {
                Navigator.pop(context);
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
