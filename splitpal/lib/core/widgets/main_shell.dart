import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:splitpay/features/home/presentation/pages/home_page.dart';
import 'package:splitpay/features/group/presentation/pages/groups_list_page.dart';
import 'package:splitpay/features/group/presentation/pages/create_group_page.dart';
import 'package:splitpay/features/group/presentation/providers/group_provider.dart';
import 'package:splitpay/features/subscription/presentation/pages/subscriptions_page.dart';
import 'package:splitpay/features/activity/presentation/pages/activity_page.dart';
import 'package:splitpay/features/profile/presentation/pages/profile_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 2; // Home is center (index 2)

  final List<Widget> _pages = [
    const GroupsListPage(),
    const SubscriptionsPage(),
    const HomePage(),
    const ActivityPage(),
    const ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      extendBody: true,
      // Show FAB only on Groups tab (index 0)
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton(
              onPressed: () => _navigateToCreateGroup(context),
              backgroundColor: const Color(0xFFE74C3C),
              elevation: 4,
              child: const Icon(Icons.add, color: Colors.white, size: 28),
            )
          : null,
      bottomNavigationBar: _buildBottomNavBar(isDark),
    );
  }

  Widget _buildBottomNavBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark 
            ? const Color(0xFF2a1a1a).withOpacity(0.95) 
            : Colors.white.withOpacity(0.95),
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.grey[800]! : Colors.grey[100]!,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _NavItem(
                icon: Icons.groups,
                label: 'Groups',
                isSelected: _currentIndex == 0,
                onTap: () => _onTabTapped(0),
                isDark: isDark,
              ),
              _NavItem(
                icon: Icons.credit_card,
                label: 'Subs',
                isSelected: _currentIndex == 1,
                onTap: () => _onTabTapped(1),
                isDark: isDark,
              ),
              _NavItem(
                icon: Icons.home,
                label: 'Home',
                isSelected: _currentIndex == 2,
                onTap: () => _onTabTapped(2),
                isDark: isDark,
              ),
              _NavItem(
                icon: Icons.notifications,
                label: 'Activity',
                isSelected: _currentIndex == 3,
                onTap: () => _onTabTapped(3),
                isDark: isDark,
                hasNotification: true,
              ),
              _NavItem(
                icon: Icons.person,
                label: 'Profile',
                isSelected: _currentIndex == 4,
                onTap: () => _onTabTapped(4),
                isDark: isDark,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _navigateToCreateGroup(BuildContext context) {
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
}

class _NavItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isDark;
  final bool hasNotification;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.isDark,
    this.hasNotification = false,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> with SingleTickerProviderStateMixin {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFE85D4E);
    final inactiveColor = widget.isDark ? Colors.grey[500]! : Colors.grey[400]!;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        scale: _isPressed ? 0.9 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: widget.isSelected 
                          ? primaryColor.withOpacity(0.1) 
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      widget.icon,
                      size: 24,
                      color: widget.isSelected ? primaryColor : inactiveColor,
                    ),
                  ),
                  if (widget.hasNotification)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: primaryColor,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: widget.isDark 
                                ? const Color(0xFF2a1a1a) 
                                : Colors.white,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: widget.isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: widget.isSelected ? primaryColor : inactiveColor,
                ),
                child: Text(widget.label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

