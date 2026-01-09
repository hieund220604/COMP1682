import 'package:dio/dio.dart';
import 'package:splitpay/core/constants/api_endpoints.dart';
import 'package:splitpay/features/group/data/models/group_models.dart';

class GroupRemoteDataSource {
  final Dio _dio;
  final String _token;

  GroupRemoteDataSource(this._dio, this._token);

  Options get _authOptions => Options(
    headers: {'Authorization': 'Bearer $_token'},
  );

  // Get all groups for current user
  Future<List<GroupModel>> getGroups() async {
    try {
      final response = await _dio.get(
        ApiEndpoints.groups,
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        return data.map((g) => GroupModel.fromJson(g)).toList();
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to get groups');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Get group by ID
  Future<GroupModel> getGroupById(String groupId) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.groupDetail(groupId),
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to get group');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Create new group
  Future<GroupModel> createGroup({
    required String name,
    String? description,
    String? baseCurrency,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.groups,
        data: {
          'name': name,
          if (description != null) 'description': description,
          if (baseCurrency != null) 'baseCurrency': baseCurrency,
        },
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to create group');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Update group
  Future<GroupModel> updateGroup(String groupId, {
    String? name,
    String? description,
    String? baseCurrency,
  }) async {
    try {
      final response = await _dio.patch(
        ApiEndpoints.groupDetail(groupId),
        data: {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
          if (baseCurrency != null) 'baseCurrency': baseCurrency,
        },
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to update group');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Delete group
  Future<void> deleteGroup(String groupId) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.groupDetail(groupId),
        options: _authOptions,
      );
      if (response.data['success'] != true) {
        throw Exception(response.data['error']?['message'] ?? 'Failed to delete group');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Get group members
  Future<List<GroupMemberModel>> getGroupMembers(String groupId) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.groupMembers(groupId),
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        return data.map((m) => GroupMemberModel.fromJson(m)).toList();
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to get members');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Invite member
  Future<InviteModel> inviteMember(String groupId, {
    required String email,
    required GroupRole role,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.groupInvites(groupId),
        data: {
          'emailInvite': email,
          'role': role.value,
        },
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return InviteModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to invite member');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Accept invite
  Future<GroupMemberModel> acceptInvite(String token) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.acceptInvite,
        data: {'token': token},
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupMemberModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to accept invite');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Update member role
  Future<GroupMemberModel> updateMemberRole(String groupId, String memberId, GroupRole role) async {
    try {
      final response = await _dio.patch(
        ApiEndpoints.memberRole(groupId, memberId),
        data: {'role': role.value},
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupMemberModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to update role');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Remove member
  Future<void> removeMember(String groupId, String memberId) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.removeMember(groupId, memberId),
        options: _authOptions,
      );
      if (response.data['success'] != true) {
        throw Exception(response.data['error']?['message'] ?? 'Failed to remove member');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Leave group
  Future<void> leaveGroup(String groupId) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.leaveGroup(groupId),
        options: _authOptions,
      );
      if (response.data['success'] != true) {
        throw Exception(response.data['error']?['message'] ?? 'Failed to leave group');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Get group balance
  Future<GroupBalanceModel> getGroupBalance(String groupId) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.groupBalance(groupId),
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        return GroupBalanceModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to get balance');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }

  // Get pending invites for current user
  Future<List<InviteModel>> getPendingInvites() async {
    try {
      final response = await _dio.get(
        ApiEndpoints.pendingInvites,
        options: _authOptions,
      );
      if (response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        return data.map((i) => InviteModel.fromJson(i)).toList();
      }
      throw Exception(response.data['error']?['message'] ?? 'Failed to get pending invites');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error']?['message'] ?? 'Network error');
    }
  }
}
