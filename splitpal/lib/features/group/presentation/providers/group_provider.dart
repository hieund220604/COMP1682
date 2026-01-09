import 'package:flutter/material.dart';
import 'package:splitpay/features/group/data/models/group_models.dart';
import 'package:splitpay/features/group/data/repositories/group_repository.dart';

enum GroupStatus {
  initial,
  loading,
  loaded,
  error,
}

class GroupProvider with ChangeNotifier {
  final GroupRepository _repository;

  GroupProvider({required GroupRepository repository}) : _repository = repository;

  GroupStatus _status = GroupStatus.initial;
  List<GroupModel> _groups = [];
  GroupModel? _currentGroup;
  List<GroupMemberModel> _members = [];
  GroupBalanceModel? _balance;
  String? _errorMessage;

  // Getters
  GroupStatus get status => _status;
  List<GroupModel> get groups => _groups;
  GroupModel? get currentGroup => _currentGroup;
  List<GroupMemberModel> get members => _members;
  List<InviteModel> _pendingInvites = [];
  List<InviteModel> get pendingInvites => _pendingInvites;
  GroupBalanceModel? get balance => _balance;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == GroupStatus.loading;

  // Fetch pending invites
  Future<void> fetchPendingInvites() async {
    // Don't set loading globally to avoid blocking UI for just fetching invites
    try {
      _pendingInvites = await _repository.getPendingInvites();
      notifyListeners();
    } catch (e) {
      print('Error fetching pending invites: $e'); // Silently fail or log
    }
  }

  // Fetch all groups
  Future<void> fetchGroups() async {
    _setLoading();
    try {
      _groups = await _repository.getGroups();
      _status = GroupStatus.loaded;
      _errorMessage = null;
    } catch (e) {
      _setError(e.toString());
    }
    notifyListeners();
  }

  // Fetch single group
  Future<void> fetchGroupById(String groupId) async {
    _setLoading();
    try {
      _currentGroup = await _repository.getGroupById(groupId);
      _status = GroupStatus.loaded;
      _errorMessage = null;
    } catch (e) {
      _setError(e.toString());
    }
    notifyListeners();
  }

  // Create group
  Future<bool> createGroup({
    required String name,
    String? description,
    String? baseCurrency,
  }) async {
    _setLoading();
    try {
      final newGroup = await _repository.createGroup(
        name: name,
        description: description,
        baseCurrency: baseCurrency,
      );
      _groups.insert(0, newGroup);
      _status = GroupStatus.loaded;
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Update group
  Future<bool> updateGroup(String groupId, {
    String? name,
    String? description,
    String? baseCurrency,
  }) async {
    _setLoading();
    try {
      final updated = await _repository.updateGroup(
        groupId,
        name: name,
        description: description,
        baseCurrency: baseCurrency,
      );
      final index = _groups.indexWhere((g) => g.id == groupId);
      if (index != -1) {
        _groups[index] = updated;
      }
      if (_currentGroup?.id == groupId) {
        _currentGroup = updated;
      }
      _status = GroupStatus.loaded;
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Delete group
  Future<bool> deleteGroup(String groupId) async {
    _setLoading();
    try {
      await _repository.deleteGroup(groupId);
      _groups.removeWhere((g) => g.id == groupId);
      if (_currentGroup?.id == groupId) {
        _currentGroup = null;
      }
      _status = GroupStatus.loaded;
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Fetch members
  Future<void> fetchMembers(String groupId) async {
    try {
      _members = await _repository.getGroupMembers(groupId);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
    }
  }

  // Invite member
  Future<InviteModel?> inviteMember(String groupId, {
    required String email,
    required GroupRole role,
  }) async {
    try {
      final invite = await _repository.inviteMember(
        groupId,
        email: email,
        role: role,
      );
      return invite;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return null;
    }
  }

  // Accept invite
  Future<bool> acceptInvite(String token) async {
    _setLoading();
    try {
      await _repository.acceptInvite(token);
      await fetchGroups(); // Refresh groups list
      _status = GroupStatus.loaded;
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Update member role
  Future<bool> updateMemberRole(String groupId, String memberId, GroupRole role) async {
    try {
      final updated = await _repository.updateMemberRole(groupId, memberId, role);
      final index = _members.indexWhere((m) => m.id == memberId);
      if (index != -1) {
        _members[index] = updated;
      }
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Remove member
  Future<bool> removeMember(String groupId, String memberId) async {
    try {
      await _repository.removeMember(groupId, memberId);
      _members.removeWhere((m) => m.id == memberId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Leave group
  Future<bool> leaveGroup(String groupId) async {
    try {
      await _repository.leaveGroup(groupId);
      _groups.removeWhere((g) => g.id == groupId);
      if (_currentGroup?.id == groupId) {
        _currentGroup = null;
      }
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
      return false;
    }
  }

  // Fetch balance
  Future<void> fetchBalance(String groupId) async {
    try {
      _balance = await _repository.getGroupBalance(groupId);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      notifyListeners();
    }
  }

  // Helper methods
  void _setLoading() {
    _status = GroupStatus.loading;
    _errorMessage = null;
  }

  void _setError(String message) {
    _status = GroupStatus.error;
    _errorMessage = message.replaceFirst('Exception: ', '');
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearCurrentGroup() {
    _currentGroup = null;
    _members = [];
    _balance = null;
  }
}
