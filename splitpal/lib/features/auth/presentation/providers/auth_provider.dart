import 'package:flutter/material.dart';
import 'package:splitpay/core/storage/token_storage.dart';
import 'package:splitpay/features/auth/data/models/auth_models.dart';
import 'package:splitpay/features/auth/data/repositories/auth_repository.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthProvider with ChangeNotifier {
  final AuthRepository _repository;
  final TokenStorage _tokenStorage;

  AuthProvider({
    required AuthRepository repository,
    required TokenStorage tokenStorage,
  })  : _repository = repository,
        _tokenStorage = tokenStorage;

  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _token;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _token != null;

  // Sign Up
  Future<bool> signup({
    required String email,
    required String password,
    String? displayName,
  }) async {
    _setLoading();
    
    try {
      final response = await _repository.signup(
        email: email,
        password: password,
        displayName: displayName,
      );

      if (response.success) {
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? response.message);
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  // Verify OTP
  Future<bool> verifyOTP({
    required String email,
    required String otp,
  }) async {
    _setLoading();

    try {
      final response = await _repository.verifyOTP(
        email: email,
        otp: otp,
      );

      if (response.success && response.token != null) {
        await _saveAuthData(response.user!, response.token!);
        _status = AuthStatus.authenticated;
        _user = response.user;
        _token = response.token;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? response.message);
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  // Resend OTP
  Future<bool> resendOTP(String email) async {
    try {
      final response = await _repository.resendOTP(email);
      return response.success;
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  // Login
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading();

    try {
      final response = await _repository.login(
        email: email,
        password: password,
      );

      if (response.success && response.token != null) {
        await _saveAuthData(response.user!, response.token!);
        _status = AuthStatus.authenticated;
        _user = response.user;
        _token = response.token;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        final msg = response.error ?? response.message;
        print('Debug: Login failed from server: $msg');
        _setError(msg);
        return false;
      }
    } catch (e) {
      print('Debug: Login exception: $e');
      _setError(e.toString());
      return false;
    }
  }

  // Check if user is already logged in (on app start)
  Future<void> checkAuthStatus() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final token = await _tokenStorage.getToken();
      
      if (token != null && token.isNotEmpty) {
        final user = await _repository.getCurrentUser(token);
        _token = token;
        _user = user;
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      await _tokenStorage.clearAll();
      _status = AuthStatus.unauthenticated;
    }
    
    notifyListeners();
  }

  // Logout
  Future<void> logout() async {
    await _tokenStorage.clearAll();
    _status = AuthStatus.unauthenticated;
    _user = null;
    _token = null;
    _errorMessage = null;
    notifyListeners();
  }

  // Helper methods
  void _setLoading() {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();
  }

  void _setError(String message) {
    _status = AuthStatus.error;
    _errorMessage = message;
    notifyListeners();
  }

  Future<void> _saveAuthData(UserModel user, String token) async {
    await _tokenStorage.saveToken(token);
    await _tokenStorage.saveUserInfo(
      userId: user.id,
      email: user.email,
    );
  }

  // Update Profile
  Future<void> updateProfile({String? displayName, String? avatarUrl}) async {
    if (_token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await _repository.updateProfile(
        token: _token!,
        displayName: displayName,
        avatarUrl: avatarUrl,
      );

      if (response.user != null) {
        _user = response.user;
        await _tokenStorage.saveUserInfo(
          userId: _user!.id,
          email: _user!.email,
        );
        notifyListeners();
      }
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
