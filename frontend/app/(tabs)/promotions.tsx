import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function PromotionsScreen() {
  const { user, refreshUser } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const promos = await api.getPromotions();
      setPromotions(promos);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      void refreshUser();
    }, [loadData, refreshUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await refreshUser();
    setRefreshing(false);
  };

  const handleRedeem = async (promo: any) => {
    if ((user?.points || 0) < promo.points_required) {
      Alert.alert('Puntos insuficientes', `Necesitas ${promo.points_required} puntos para canjear esta promoción. Tienes ${user?.points || 0}.`);
      return;
    }
    Alert.alert(
      'Confirmar Canje',
      `¿Quieres canjear "${promo.title}" por ${promo.points_required} puntos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          onPress: async () => {
            setRedeeming(promo.id);
            try {
              const result = await api.redeemPromotion(promo.id);
              await refreshUser();
              Alert.alert(
                'Canjeado',
                `Tu código de canje es: ${result.code}\n\nMuéstralo al personal para validar tu recompensa.`
              );
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const iconMap: Record<string, string> = {
    coffee: 'coffee',
    gift: 'gift',
    star: 'star',
    heart: 'heart',
  };

  const categoryColors: Record<string, string> = {
    coffee: '#FFF3E0',
    food: '#E8F5E9',
    special: '#F3E8FF',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Promociones</Text>
        <Text style={styles.subtitle}>Canjea tus puntos por recompensas</Text>

        {/* Points indicator */}
        <View style={styles.pointsBanner}>
          <Feather name="award" size={18} color={Colors.accent} />
          <Text style={styles.pointsBannerText}>
            Tienes <Text style={styles.pointsBold}>{user?.points || 0} puntos</Text>
          </Text>
        </View>

        {promotions.map((promo) => {
          const canRedeem = (user?.points || 0) >= promo.points_required;
          const bgColor = categoryColors[promo.category] || '#FFF3E0';
          return (
            <View key={promo.id} testID={`promotion-${promo.id}`} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <View style={[styles.promoIconContainer, { backgroundColor: bgColor }]}>
                  <Feather
                    name={(iconMap[promo.icon] || 'star') as any}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.promoHeaderInfo}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoCategory}>{promo.category}</Text>
                </View>
              </View>

              <Text style={styles.promoDescription}>{promo.description}</Text>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(((user?.points || 0) / promo.points_required) * 100, 100)}%`,
                        backgroundColor: canRedeem ? Colors.success : Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.min(user?.points || 0, promo.points_required)}/{promo.points_required} pts
                </Text>
              </View>

              <TouchableOpacity
                testID={`redeem-btn-${promo.id}`}
                style={[
                  styles.redeemButton,
                  !canRedeem && styles.redeemButtonDisabled,
                ]}
                onPress={() => handleRedeem(promo)}
                disabled={!canRedeem || redeeming === promo.id}
              >
                {redeeming === promo.id ? (
                  <ActivityIndicator color={Colors.primaryForeground} size="small" />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color={canRedeem ? Colors.primaryForeground : Colors.textSecondary} />
                    <Text style={[styles.redeemText, !canRedeem && styles.redeemTextDisabled]}>
                      {canRedeem ? 'Canjear Ahora' : 'Puntos Insuficientes'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
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
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.l,
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    gap: Spacing.s,
  },
  pointsBannerText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.8)',
  },
  pointsBold: {
    fontFamily: Fonts.bodyBold,
    color: Colors.accent,
  },
  promoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    ...Shadows.soft,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  promoIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  promoHeaderInfo: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  promoCategory: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  promoDescription: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.m,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  redeemButton: {
    height: 48,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.s,
  },
  redeemButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  redeemText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primaryForeground,
  },
  redeemTextDisabled: {
    color: Colors.textSecondary,
  },
});
