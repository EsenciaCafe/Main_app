import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await refreshUser();
      const recentRedemptions = await api.getMyRedemptions();
      setRedemptions(recentRedemptions.slice(0, 5));
    } catch {}
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const performLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('¿Seguro que quieres cerrar sesion?')) {
        void performLogout();
      }
      return;
    }

    Alert.alert('Cerrar sesion', '¿Seguro que quieres cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesion',
        style: 'destructive',
        onPress: () => {
          void performLogout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Perfil</Text>

        <View testID="profile-card" style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.pointsBadge}>
            <Feather name="award" size={16} color={Colors.accent} />
            <Text style={styles.pointsBadgeText}>{user?.points || 0} puntos</Text>
          </View>
        </View>

        {user?.role === 'admin' && (
          <TouchableOpacity
            testID="admin-panel-btn"
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.adminIcon}>
              <Feather name="shield" size={22} color={Colors.primaryForeground} />
            </View>
            <View style={styles.adminInfo}>
              <Text style={styles.adminTitle}>Panel de Administracion</Text>
              <Text style={styles.adminSubtitle}>Gestionar clientes, puntos y promociones</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.primaryForeground} />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Canjes recientes</Text>
        </View>

        {redemptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="gift" size={32} color={Colors.border} />
            <Text style={styles.emptyText}>Aun no has canjeado recompensas</Text>
          </View>
        ) : (
          redemptions.map((redemption) => (
            <View key={redemption.id} testID={`redemption-${redemption.id}`} style={styles.redemptionCard}>
              <View style={styles.redemptionTop}>
                <Text style={styles.redemptionTitle}>{redemption.promotion_title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: redemption.status === 'validated' ? '#E8F5E9' : '#FFF3E0' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: redemption.status === 'validated' ? Colors.success : Colors.primary },
                    ]}
                  >
                    {redemption.status === 'validated' ? 'Validado' : 'Pendiente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.redemptionCode}>Codigo: {redemption.code}</Text>
              <Text style={styles.redemptionDate}>
                {new Date(redemption.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ))
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity testID="my-qr-btn" style={styles.menuItem} onPress={() => router.push('/(tabs)/qrcode')}>
            <Feather name="maximize" size={20} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Mi codigo QR</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity testID="history-btn" style={styles.menuItem} onPress={() => router.push('/(tabs)/history')}>
            <Feather name="clock" size={20} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Historial completo</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.l,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.l,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.m,
    ...Shadows.soft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h1,
    color: Colors.accent,
  },
  userName: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginTop: Spacing.m,
    gap: Spacing.s,
  },
  pointsBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.accent,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    ...Shadows.medium,
  },
  adminIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.s,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primaryForeground,
  },
  adminSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.m,
    ...Shadows.soft,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.s,
  },
  redemptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  redemptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  redemptionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
  },
  redemptionCode: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  redemptionDate: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    marginTop: Spacing.l,
    marginBottom: Spacing.m,
    ...Shadows.soft,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.m,
  },
  menuText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.m,
    marginTop: Spacing.s,
  },
  logoutText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.error,
  },
});
