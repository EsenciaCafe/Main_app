import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError, type User } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

function filterUsers(users: User[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return users;
  }

  return users.filter((user) => {
    const normalizedName = user.name?.toLowerCase() ?? '';
    const normalizedEmail = user.email?.toLowerCase() ?? '';
    return (
      normalizedName.includes(normalizedSearch) ||
      normalizedEmail.includes(normalizedSearch)
    );
  });
}

export default function ManageUsersScreen() {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'customer' as 'customer' | 'admin',
    club_member: false,
    membership_tier: '',
  });

  const membershipOptions = useMemo(() => ['Club', 'Gold', 'Founder'], []);

  const syncVisibleUsers = useCallback((nextUsers: User[], currentSearch: string) => {
    setAllUsers(nextUsers);
    setUsers(filterUsers(nextUsers, currentSearch));
  }, []);

  const loadUsers = useCallback(async () => {
    setSearching(true);
    try {
      const results = await api.searchUsers('');
      syncVisibleUsers(results, search);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSearching(false);
    }
  }, [search, syncVisibleUsers]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setUsers(filterUsers(allUsers, value));
    setSelectedUser(null);
  };

  const handleSearch = async () => {
    if (allUsers.length === 0) {
      await loadUsers();
      return;
    }

    const filteredUsers = filterUsers(allUsers, search);
    setUsers(filteredUsers);
    setSelectedUser(null);

    if (search.trim() && filteredUsers.length === 0) {
      Alert.alert('Sin resultados', 'No encontramos usuarios con esa busqueda.');
    }
  };

  const loadUserIntoForm = (user: User) => {
    setSelectedUser(user);
    setForm({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role === 'admin' ? 'admin' : 'customer',
      club_member: Boolean(user.club_member),
      membership_tier: user.membership_tier ?? '',
    });
  };

  const handleSave = async () => {
    if (!selectedUser) {
      Alert.alert('Selecciona un usuario', 'Primero elige una cuenta para editar.');
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Campos incompletos', 'Nombre y email son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await api.updateUser(selectedUser.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        club_member: form.club_member,
        membership_tier: form.club_member ? form.membership_tier.trim() || null : null,
      });

      setSelectedUser(updatedUser);
      const nextUsers = allUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user));
      syncVisibleUsers(nextUsers, search);
      setForm({
        name: updatedUser.name ?? '',
        email: updatedUser.email ?? '',
        role: updatedUser.role === 'admin' ? 'admin' : 'customer',
        club_member: Boolean(updatedUser.club_member),
        membership_tier: updatedUser.membership_tier ?? '',
      });
      Alert.alert('Usuario actualizado', 'Los cambios se guardaron correctamente.');
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 404) {
        Alert.alert(
          'Backend sin actualizar',
          'La busqueda ya funciona con el backend actual, pero para guardar ediciones necesitas publicar tambien la nueva version del backend.'
        );
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchRow}>
          <TextInput
            testID="search-user-input"
            style={styles.searchInput}
            placeholder="Filtrar por nombre o email..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => void handleSearch()}
          />
          <TouchableOpacity testID="search-user-btn" style={styles.searchButton} onPress={() => void handleSearch()}>
            {searching ? (
              <ActivityIndicator color={Colors.primaryForeground} size="small" />
            ) : (
              <Feather name="search" size={20} color={Colors.primaryForeground} />
            )}
          </TouchableOpacity>
        </View>

        {!selectedUser && (
          <Text style={styles.resultsLabel}>
            {search.trim() ? `Resultados: ${users.length}` : `Usuarios cargados: ${users.length}`}
          </Text>
        )}

        {users.length > 0 && !selectedUser && (
          <View style={styles.resultsSection}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                testID={`user-result-${user.id}`}
                style={styles.userResult}
                onPress={() => loadUserIntoForm(user)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{user.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user.role === 'admin' ? 'Admin' : 'Cliente'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!searching && users.length === 0 && !selectedUser && (
          <View style={styles.emptyCard}>
            <Feather name="users" size={32} color={Colors.border} />
            <Text style={styles.emptyText}>
              {search.trim()
                ? 'No hay usuarios que coincidan con ese filtro.'
                : 'No se pudieron cargar usuarios todavia.'}
            </Text>
          </View>
        )}

        {selectedUser && (
          <>
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{selectedUser.name}</Text>
                  <Text style={styles.userEmail}>{selectedUser.email}</Text>
                </View>
                <TouchableOpacity testID="change-user-btn" onPress={() => setSelectedUser(null)}>
                  <Feather name="x" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedMeta}>Puntos actuales: {selectedUser.points}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                testID="user-name-input"
                style={styles.input}
                value={form.name}
                onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
                placeholder="Nombre del usuario"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="user-email-input"
                style={styles.input}
                value={form.email}
                onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <Text style={styles.label}>Rol</Text>
            <View style={styles.optionsRow}>
              {(['customer', 'admin'] as const).map((roleOption) => (
                <TouchableOpacity
                  key={roleOption}
                  testID={`role-option-${roleOption}`}
                  style={[styles.optionChip, form.role === roleOption && styles.optionChipActive]}
                  onPress={() => setForm((current) => ({ ...current, role: roleOption }))}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      form.role === roleOption && styles.optionChipTextActive,
                    ]}
                  >
                    {roleOption === 'admin' ? 'Admin' : 'Cliente'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Club</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                testID="club-member-no"
                style={[styles.optionChip, !form.club_member && styles.optionChipActive]}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    club_member: false,
                    membership_tier: '',
                  }))
                }
              >
                <Text style={[styles.optionChipText, !form.club_member && styles.optionChipTextActive]}>
                  Sin acceso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="club-member-yes"
                style={[styles.optionChip, form.club_member && styles.optionChipActive]}
                onPress={() => setForm((current) => ({ ...current, club_member: true }))}
              >
                <Text style={[styles.optionChipText, form.club_member && styles.optionChipTextActive]}>
                  Miembro
                </Text>
              </TouchableOpacity>
            </View>

            {form.club_member && (
              <>
                <Text style={styles.label}>Nivel del Club</Text>
                <View style={styles.optionsRow}>
                  {membershipOptions.map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      testID={`membership-tier-${tier}`}
                      style={[
                        styles.optionChip,
                        form.membership_tier === tier && styles.optionChipActive,
                      ]}
                      onPress={() => setForm((current) => ({ ...current, membership_tier: tier }))}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          form.membership_tier === tier && styles.optionChipTextActive,
                        ]}
                      >
                        {tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  testID="membership-tier-input"
                  style={[styles.input, { marginTop: Spacing.s }]}
                  value={form.membership_tier}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, membership_tier: value }))
                  }
                  placeholder="Nivel personalizado"
                  placeholderTextColor={Colors.textSecondary}
                />
              </>
            )}

            <TouchableOpacity
              testID="save-user-btn"
              style={[styles.submitButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="save" size={18} color={Colors.primaryForeground} />
                  <Text style={styles.submitText}>Guardar cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: {
    padding: Spacing.containerPadding,
    paddingBottom: Spacing.xxl,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsSection: {
    marginBottom: Spacing.m,
  },
  resultsLabel: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  userAvatarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.accent,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  roleBadgeText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.s,
    textAlign: 'center',
  },
  selectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    ...Shadows.soft,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  selectedMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.m,
  },
  label: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginBottom: Spacing.s,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  optionChip: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  optionChipActive: {
    backgroundColor: Colors.secondary,
  },
  optionChipText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  optionChipTextActive: {
    color: Colors.primaryForeground,
  },
  submitButton: {
    height: 56,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.s,
    marginTop: Spacing.m,
    ...Shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primaryForeground,
  },
});
