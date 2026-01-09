/// Group role enum
enum GroupRole {
  owner('OWNER'),
  admin('ADMIN'),
  user('USER');

  final String value;
  const GroupRole(this.value);

  static GroupRole fromString(String value) {
    return GroupRole.values.firstWhere(
      (e) => e.value == value,
      orElse: () => GroupRole.user,
    );
  }
}

/// User summary model (reused from auth)
class UserSummary {
  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;

  UserSummary({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'],
      avatarUrl: json['avatarUrl'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'displayName': displayName,
    'avatarUrl': avatarUrl,
  };
}

/// Group member model
class GroupMemberModel {
  final String id;
  final String userId;
  final String groupId;
  final GroupRole role;
  final DateTime joinedAt;
  final DateTime? leftAt;
  final UserSummary? user;

  GroupMemberModel({
    required this.id,
    required this.userId,
    required this.groupId,
    required this.role,
    required this.joinedAt,
    this.leftAt,
    this.user,
  });

  factory GroupMemberModel.fromJson(Map<String, dynamic> json) {
    return GroupMemberModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      groupId: json['groupId'] ?? '',
      role: GroupRole.fromString(json['role'] ?? 'USER'),
      joinedAt: DateTime.parse(json['joinedAt'] ?? DateTime.now().toIso8601String()),
      leftAt: json['leftAt'] != null ? DateTime.parse(json['leftAt']) : null,
      user: json['user'] != null ? UserSummary.fromJson(json['user']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'groupId': groupId,
    'role': role.value,
    'joinedAt': joinedAt.toIso8601String(),
    'leftAt': leftAt?.toIso8601String(),
    'user': user?.toJson(),
  };
}

/// Group model
class GroupModel {
  final String id;
  final String name;
  final String description;
  final String baseCurrency;
  final DateTime createdAt;
  final String createdBy;
  final int? memberCount;
  final List<GroupMemberModel>? members;

  GroupModel({
    required this.id,
    required this.name,
    required this.description,
    required this.baseCurrency,
    required this.createdAt,
    required this.createdBy,
    this.memberCount,
    this.members,
  });

  factory GroupModel.fromJson(Map<String, dynamic> json) {
    return GroupModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      baseCurrency: json['baseCurrency'] ?? 'VND',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      createdBy: json['createdBy'] ?? '',
      memberCount: json['memberCount'],
      members: json['members'] != null
          ? (json['members'] as List).map((m) => GroupMemberModel.fromJson(m)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'baseCurrency': baseCurrency,
    'createdAt': createdAt.toIso8601String(),
    'createdBy': createdBy,
    'memberCount': memberCount,
    'members': members?.map((m) => m.toJson()).toList(),
  };
}

/// Invite model
class InviteModel {
  final String id;
  final String emailInvite;
  final GroupRole role;
  final String status;
  final DateTime expiresAt;
  final DateTime createdAt;
  final String? token;
  final String? groupName;
  final String? groupId;

  InviteModel({
    required this.id,
    required this.emailInvite,
    required this.role,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
    this.token,
    this.groupName,
    this.groupId,
  });

  factory InviteModel.fromJson(Map<String, dynamic> json) {
    return InviteModel(
      id: json['id'] ?? '',
      emailInvite: json['emailInvite'] ?? '',
      role: GroupRole.fromString(json['role'] ?? 'USER'),
      status: json['status'] ?? 'PENDING',
      expiresAt: DateTime.parse(json['expiresAt'] ?? DateTime.now().toIso8601String()),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      token: json['token'],
      groupName: json['groupName'],
      groupId: json['groupId'],
    );
  }
}

/// Member balance model
class MemberBalanceModel {
  final String userId;
  final String? displayName;
  final double totalOwed;
  final double totalLent;
  final double netBalance;

  MemberBalanceModel({
    required this.userId,
    this.displayName,
    required this.totalOwed,
    required this.totalLent,
    required this.netBalance,
  });

  factory MemberBalanceModel.fromJson(Map<String, dynamic> json) {
    return MemberBalanceModel(
      userId: json['userId'] ?? '',
      displayName: json['displayName'],
      totalOwed: (json['totalOwed'] ?? 0).toDouble(),
      totalLent: (json['totalLent'] ?? 0).toDouble(),
      netBalance: (json['netBalance'] ?? 0).toDouble(),
    );
  }
}

/// Group balance response
class GroupBalanceModel {
  final String groupId;
  final List<MemberBalanceModel> members;

  GroupBalanceModel({
    required this.groupId,
    required this.members,
  });

  factory GroupBalanceModel.fromJson(Map<String, dynamic> json) {
    return GroupBalanceModel(
      groupId: json['groupId'] ?? '',
      members: (json['members'] as List?)
          ?.map((m) => MemberBalanceModel.fromJson(m))
          .toList() ?? [],
    );
  }
}

/// API Response wrapper
class GroupApiResponse<T> {
  final bool success;
  final T? data;
  final String? errorMessage;
  final String? errorCode;

  GroupApiResponse({
    required this.success,
    this.data,
    this.errorMessage,
    this.errorCode,
  });
}
