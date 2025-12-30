import 'package:splitpay/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:splitpay/features/auth/data/models/auth_models.dart';

class AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  AuthRepository(this._remoteDataSource);

  Future<AuthResponse> signup({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final request = SignupRequest(
      email: email,
      password: password,
      displayName: displayName,
    );
    return await _remoteDataSource.signup(request);
  }

  Future<AuthResponse> verifyOTP({
    required String email,
    required String otp,
  }) async {
    final request = VerifyOTPRequest(email: email, otp: otp);
    return await _remoteDataSource.verifyOTP(request);
  }

  Future<AuthResponse> resendOTP(String email) async {
    return await _remoteDataSource.resendOTP(email);
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final request = LoginRequest(email: email, password: password);
    return await _remoteDataSource.login(request);
  }

  Future<UserModel> getCurrentUser(String token) async {
    return await _remoteDataSource.getCurrentUser(token);
  }
}
