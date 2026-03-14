import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function ValidateScreen() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getPendingRedemptions();
      setRedemptions(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleValidate = (redemption: any) => {
    Alert.alert(
      'Validar Canje',
      `¿Validar "${redemption.promotion_title}" para ${redemption.user_name}?\n\nCódigo: ${redemption.code}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Validar',
          onPress: async () => {
            setValidating(redemption.id);
            try {
              await api.validateRedemption(redemption.id);
              await loadData();
              Alert.alert('Validado', 'Canje validado correctamente');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setValidating(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {redemptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="check-circle" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Sin canjes pendientes</Text>
          <Text style={styles.emptyText}>Los canjes de clientes aparecerán aquí</Text>
        </View>
      ) : (
        redemptions.map((r) => (
          <View key={r.id} testID={`pending-redemption-${r.id}`} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Feather name="gift" size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{r.promotion_title}</Text>
                <Text style={styles.cardCustomer}>{r.user_name}</Text>
              </View>
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Código:</Text>
              <Text style={styles.codeValue}>{r.code}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Puntos: {r.points_used}</Text>
              <Text style={styles.detailText}>
                {new Date(r.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>

            <TouchableOpacity
              testID={`validate-btn-${r.id}`}
              style={styles.validateButton}
              onPress={() => handleValidate(r)}
              disabled={validating === r.id}
            >
              {validating === r.id ? (
                <ActivityIndicator color={Colors.primaryForeground} size="small" />
              ) : (
                <>
                  <Feather name="check" size={18} color={Colors.primaryForeground} />
                  <Text style={styles.validateText}>Validar Canje</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerPadding, paddingBottom: Spacing.xxl },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.m,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.s,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    ...Shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.s,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  cardCustomer: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.s,
    padding: Spacing.s,
    marginBottom: Spacing.s,
    gap: Spacing.s,
  },
  codeLabel: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  codeValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.primary,
    letterSpacing: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.m,
  },
  detailText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  validateButton: {
    height: 48,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.s,
  },
  validateText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primaryForeground,
  },
});
