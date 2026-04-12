import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_rewards-esencia/artifacts/4dh7zadu_IMG_2592.png';

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await refreshUser();
      const promos = await api.getPromotions();
      setPromotions(promos.slice(0, 3));
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

  const iconMap: Record<string, string> = {
    coffee: 'coffee',
    gift: 'gift',
    star: 'star',
    heart: 'heart',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{user?.name || 'Cliente'}</Text>
          </View>
          <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} resizeMode="contain" />
        </View>

        {/* Points Card */}
        <View testID="points-card" style={styles.pointsCard}>
          <View style={styles.pointsTop}>
            <Text style={styles.pointsLabel}>Tus Puntos</Text>
            <Feather name="award" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.pointsValue}>{user?.points || 0}</Text>
          <Text style={styles.pointsHint}>Acumula puntos con cada consumo</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="quick-promos-btn"
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/promotions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Feather name="gift" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Ver Promos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="quick-qr-btn"
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/qrcode')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="maximize" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.actionText}>Mi QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="quick-history-btn"
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/history')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Feather name="clock" size={22} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Active Promotions Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promociones Activas</Text>
          <TouchableOpacity testID="see-all-promos-btn" onPress={() => router.push('/(tabs)/promotions')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {promotions.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            testID={`promo-card-${promo.id}`}
            style={styles.promoCard}
            onPress={() => router.push('/(tabs)/promotions')}
          >
            <View style={styles.promoIcon}>
              <Feather
                name={(iconMap[promo.icon] || 'star') as any}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.promoInfo}>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.promoDesc} numberOfLines={1}>{promo.description}</Text>
            </View>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>{promo.points_required} pts</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.containerPadding, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.m,
    marginBottom: Spacing.l,
  },
  greeting: {
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  userName: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  pointsCard: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    marginBottom: Spacing.l,
    ...Shadows.medium,
  },
  pointsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: 'rgba(255,255,255,0.7)',
  },
  pointsValue: {
    fontFamily: Fonts.heading,
    fontSize: 56,
    color: Colors.accent,
    marginTop: Spacing.s,
  },
  pointsHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.m,
    marginBottom: Spacing.l,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    alignItems: 'center',
    ...Shadows.soft,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  actionText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.s,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  promoDesc: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  promoBadge: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  promoBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.primary,
  },
});
