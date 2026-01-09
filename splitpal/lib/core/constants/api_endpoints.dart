import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiEndpoints {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web/Windows/Simulator
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    }
    // Android emulator access to host localhost
    if (Platform.isAndroid) {
      // Using ADB reverse proxy (adb reverse tcp:8080 tcp:8080)
      // This allows accessing host localhost via emulator localhost
      return 'http://localhost:8080/api'; 
    }
    return 'http://localhost:8080/api';
  }
  
  // Auth
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/signup';
  static String get me => '$baseUrl/auth/me';

  // Groups
  static String get groups => '$baseUrl/groups';
  static String groupDetail(String groupId) => '$baseUrl/groups/$groupId';
  static String groupMembers(String groupId) => '$baseUrl/groups/$groupId/members';
  static String groupBalance(String groupId) => '$baseUrl/groups/$groupId/balance';
  static String groupInvites(String groupId) => '$baseUrl/groups/$groupId/invites';
  static String get acceptInvite => '$baseUrl/groups/invites/accept';
  static String get pendingInvites => '$baseUrl/groups/invites/pending';
  static String leaveGroup(String groupId) => '$baseUrl/groups/$groupId/leave';
  static String memberRole(String groupId, String memberId) => 
      '$baseUrl/groups/$groupId/members/$memberId/role';
  static String removeMember(String groupId, String memberId) => 
      '$baseUrl/groups/$groupId/members/$memberId';
  
  // Expenses
  static String expenses(String groupId) => '$baseUrl/groups/$groupId/expenses';
  static String expenseDetail(String groupId, String expenseId) => '$baseUrl/groups/$groupId/expenses/$expenseId';

  // Settlements
  static String settlements(String groupId) => '$baseUrl/groups/$groupId/settlements';
  static String suggestedSettlements(String groupId) => '$baseUrl/groups/$groupId/settlements/suggested';

  // VNPay
  static String get payment => '$baseUrl/payments';
}
