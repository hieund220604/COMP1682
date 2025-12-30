class UserModel {
  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? status;

  UserModel({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.status,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['userId'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'],
      avatarUrl: json['avatarUrl'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'status': status,
    };
  }
}

class AuthResponse {
  final bool success;
  final String message;
  final UserModel? user;
  final String? token;
  final String? error;

  AuthResponse({
    required this.success,
    required this.message,
    this.user,
    this.token,
    this.error,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    UserModel? user;
    String? token;

    if (json['data'] != null) {
      final data = json['data'] as Map<String, dynamic>;
      if (data['user'] != null) {
        user = UserModel.fromJson(data['user']);
      }
      token = data['token'];
    }

    return AuthResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      user: user,
      token: token,
      error: json['error'],
    );
  }
}

class SignupRequest {
  final String email;
  final String password;
  final String? displayName;

  SignupRequest({
    required this.email,
    required this.password,
    this.displayName,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      if (displayName != null) 'displayName': displayName,
    };
  }
}

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

class VerifyOTPRequest {
  final String email;
  final String otp;

  VerifyOTPRequest({
    required this.email,
    required this.otp,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'otp': otp,
    };
  }
}
