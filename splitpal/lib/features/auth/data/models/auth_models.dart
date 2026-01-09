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
      
      // Handle nested structure: data.user.user and data.user.token
      // This is the login response structure
      if (data['user'] != null && data['user'] is Map<String, dynamic>) {
        final userData = data['user'] as Map<String, dynamic>;
        
        // Check if it's nested (login response: data.user.user + data.user.token)
        if (userData['user'] != null && userData['token'] != null) {
          user = UserModel.fromJson(userData['user']);
          token = userData['token'];
        } else {
          // Flat structure (other responses: data.user + data.token)
          user = UserModel.fromJson(userData);
          token = data['token'];
        }
      }
      
      // Fallback: token might be directly in data
      token ??= data['token'];
    }

    String? errorMsg;
    if (json['error'] != null) {
      if (json['error'] is String) {
        errorMsg = json['error'];
      } else if (json['error'] is Map) {
        final errMap = json['error'] as Map<String, dynamic>;
        errorMsg = errMap['message'] ?? errMap['error'] ?? 'Unknown error';
      } else {
        errorMsg = json['error'].toString();
      }
    }

    return AuthResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      user: user,
      token: token,
      error: errorMsg,
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
