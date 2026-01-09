import 'package:dio/dio.dart';
import 'package:splitpay/core/constants/api_endpoints.dart';
import 'package:splitpay/features/auth/data/models/auth_models.dart';

class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  Future<AuthResponse> signup(SignupRequest request) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.register,
        data: request.toJson(),
      );
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<AuthResponse> verifyOTP(VerifyOTPRequest request) async {
    try {
      final response = await _dio.post(
        '${ApiEndpoints.baseUrl}/auth/verify-otp',
        data: request.toJson(),
      );
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<AuthResponse> resendOTP(String email) async {
    try {
      final response = await _dio.post(
        '${ApiEndpoints.baseUrl}/auth/resend-otp',
        data: {'email': email},
      );
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<AuthResponse> login(LoginRequest request) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.login,
        data: request.toJson(),
      );
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        return AuthResponse.fromJson(e.response!.data);
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<UserModel> getCurrentUser(String token) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.me,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      final authResponse = AuthResponse.fromJson(response.data);
      if (authResponse.user == null) {
        throw Exception('User data not found');
      }
      return authResponse.user!;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to get user');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<AuthResponse> updateProfile({
    required String token,
    String? displayName,
    String? avatarUrl,
  }) async {
    try {
      final Map<String, dynamic> data = {};
      if (displayName != null) data['displayName'] = displayName;
      if (avatarUrl != null) data['avatarUrl'] = avatarUrl;

      final response = await _dio.put(
        '${ApiEndpoints.baseUrl}/auth/profile',
        data: data,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to update profile');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}
