import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const s = await api.getStats();
      setStats(s);
    } catch {}
  }, []);

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

  const menuItems = [
    {
      id: 'scanner',
      title: 'Escanear Cliente',
      subtitle: 'Identificar por QR',
      icon: 'camera' as const,
      color: '#F3E8FF',
      iconColor: '#7C3AED',
      route: '/admin/scanner',
    },
    {
      id: 'add-points',
      title: 'Agregar Puntos',
      subtitle: 'Buscar y sumar puntos',
      icon: 'plus-circle' as const,
      color: '#E8F5E9',
      iconColor: Colors.success,
      route: '/admin/add-points',
    },
    {
      id: 'promos',
      title: 'Gestionar Promos',
      subtitle: 'Crear y editar promociones',
      icon: 'gift' as const,
      color: '#FFF3E0',
      iconColor: Colors.primary,
      route: '/admin/manage-promos',
    },
    {
      id: 'validate',
      title: 'Validar Canjes',
      subtitle: 'Canjes pendientes',
      icon: 'check-circle' as const,
      color: '#E3F2FD',
      iconColor: '#2196F3',
      route: '/admin/validate',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View testID="stat-customers" style={styles.statCard}>
          <Feather name="users" size={20} color={Colors.primary} />
          <Text style={styles.statValue}>{stats?.total_customers || 0}</Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </View>
        <View testID="stat-points" style={styles.statCard}>
          <Feather name="award" size={20} color={Colors.accent} />
          <Text style={styles.statValue}>{stats?.total_points_given || 0}</Text>
          <Text style={styles.statLabel}>Puntos Dados</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View testID="stat-redemptions" style={styles.statCard}>
          <Feather name="gift" size={20} color={Colors.success} />
          <Text style={styles.statValue}>{stats?.total_redemptions || 0}</Text>
          <Text style={styles.statLabel}>Canjes</Text>
        </View>
        <View testID="stat-pending" style={styles.statCard}>
          <Feather name="clock" size={20} color={Colors.warning} />
          <Text style={styles.statValue}>{stats?.pending_redemptions || 0}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>Acciones</Text>

      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          testID={`admin-menu-${item.id}`}
          style={styles.menuItem}
          onPress={() => router.push(item.route as any)}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
            <Feather name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.containerPadding,
    paddingBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    alignItems: 'center',
    ...Shadows.soft,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.s,
  },
  statLabel: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.m,
    marginBottom: Spacing.m,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
