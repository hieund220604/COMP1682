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
      // Trying local IP instead of 10.0.2.2 as it might be more reliable in some network configs
      return 'http://10.0.2.2:8080/api'; 
    }
    return 'http://localhost:8080/api';
  }
  
  // Auth
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/signup';
  static String get me => '$baseUrl/auth/me';

  // Groups
  static String get groups => '$baseUrl/groups';
  
  // Expenses
  static String expenses(String groupId) => '$baseUrl/groups/$groupId/expenses';
  static String expenseDetail(String groupId, String expenseId) => '$baseUrl/groups/$groupId/expenses/$expenseId';

  // Settlements
  static String settlements(String groupId) => '$baseUrl/groups/$groupId/settlements';
  static String suggestedSettlements(String groupId) => '$baseUrl/groups/$groupId/settlements/suggested';

  // VNPay
  static String get payment => '$baseUrl/payments';
}
