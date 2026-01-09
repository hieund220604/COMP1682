import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  bool _expenseNotifications = true;
  bool _paymentNotifications = true;
  bool _groupNotifications = true;
  bool _reminderNotifications = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _expenseNotifications = prefs.getBool('expense_notifications') ?? true;
      _paymentNotifications = prefs.getBool('payment_notifications') ?? true;
      _groupNotifications = prefs.getBool('group_notifications') ?? true;
      _reminderNotifications = prefs.getBool('reminder_notifications') ?? false;
    });
  }

  Future<void> _savePreference(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF1a1010) : const Color(0xFFFCFCFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1a1010) : const Color(0xFFFCFCFC),
        elevation: 0,
        title: Text(
          'Notifications',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : const Color(0xFF181111),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Manage your notification preferences',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),

            _buildNotificationItem(
              isDark: isDark,
              title: 'Expense Updates',
              subtitle: 'Get notified when expenses are added or updated',
              value: _expenseNotifications,
              onChanged: (value) {
                setState(() => _expenseNotifications = value);
                _savePreference('expense_notifications', value);
              },
            ),
            _buildNotificationItem(
              isDark: isDark,
              title: 'Payment Requests',
              subtitle: 'Receive notifications for payment requests',
              value: _paymentNotifications,
              onChanged: (value) {
                setState(() => _paymentNotifications = value);
                _savePreference('payment_notifications', value);
              },
            ),
            _buildNotificationItem(
              isDark: isDark,
              title: 'Group Activities',
              subtitle: 'Updates about group members and activities',
              value: _groupNotifications,
              onChanged: (value) {
                setState(() => _groupNotifications = value);
                _savePreference('group_notifications', value);
              },
            ),
            _buildNotificationItem(
              isDark: isDark,
              title: 'Reminders',
              subtitle: 'Periodic reminders for unsettled balances',
              value: _reminderNotifications,
              onChanged: (value) {
                setState(() => _reminderNotifications = value);
                _savePreference('reminder_notifications', value);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem({
    required bool isDark,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF2a1a1a) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.grey[800]! : Colors.grey[100]!,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : const Color(0xFF181111),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFFE85D4E),
          ),
        ],
      ),
    );
  }
}
