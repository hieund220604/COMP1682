import 'package:splitpay/features/group/data/datasources/group_remote_data_source.dart';
import 'package:splitpay/features/group/data/models/group_models.dart';

class GroupRepository {
  final GroupRemoteDataSource _remoteDataSource;

  GroupRepository(this._remoteDataSource);

  // Get all groups
  Future<List<GroupModel>> getGroups() async {
    return await _remoteDataSource.getGroups();
  }

  // Get group by ID
  Future<GroupModel> getGroupById(String groupId) async {
    return await _remoteDataSource.getGroupById(groupId);
  }

  // Create group
  Future<GroupModel> createGroup({
    required String name,
    String? description,
    String? baseCurrency,
  }) async {
    return await _remoteDataSource.createGroup(
      name: name,
      description: description,
      baseCurrency: baseCurrency,
    );
  }

  // Update group
  Future<GroupModel> updateGroup(String groupId, {
    String? name,
    String? description,
    String? baseCurrency,
  }) async {
    return await _remoteDataSource.updateGroup(
      groupId,
      name: name,
      description: description,
      baseCurrency: baseCurrency,
    );
  }

  // Delete group
  Future<void> deleteGroup(String groupId) async {
    return await _remoteDataSource.deleteGroup(groupId);
  }

  // Get members
  Future<List<GroupMemberModel>> getGroupMembers(String groupId) async {
    return await _remoteDataSource.getGroupMembers(groupId);
  }

  // Invite member
  Future<InviteModel> inviteMember(String groupId, {
    required String email,
    required GroupRole role,
  }) async {
    return await _remoteDataSource.inviteMember(
      groupId,
      email: email,
      role: role,
    );
  }

  // Accept invite
  Future<GroupMemberModel> acceptInvite(String token) async {
    return await _remoteDataSource.acceptInvite(token);
  }

  // Update member role
  Future<GroupMemberModel> updateMemberRole(
    String groupId,
    String memberId,
    GroupRole role,
  ) async {
    return await _remoteDataSource.updateMemberRole(groupId, memberId, role);
  }

  // Remove member
  Future<void> removeMember(String groupId, String memberId) async {
    return await _remoteDataSource.removeMember(groupId, memberId);
  }

  // Leave group
  Future<void> leaveGroup(String groupId) async {
    return await _remoteDataSource.leaveGroup(groupId);
  }

  // Get balance
  Future<GroupBalanceModel> getGroupBalance(String groupId) async {
    return await _remoteDataSource.getGroupBalance(groupId);
  }

  // Get pending invites
  Future<List<InviteModel>> getPendingInvites() async {
    return await _remoteDataSource.getPendingInvites();
  }
}
