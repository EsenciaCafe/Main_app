import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
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

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Tu actividad de puntos y canjes</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin actividad</Text>
            <Text style={styles.emptyText}>Tu historial de puntos y canjes aparecera aqui</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={index} testID={`history-item-${index}`} style={styles.historyItem}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.type === 'points' ? '#E8F5E9' : '#FFF3E0' },
                ]}
              >
                <Feather
                  name={item.type === 'points' ? 'plus-circle' : 'gift'}
                  size={20}
                  color={item.type === 'points' ? Colors.success : Colors.primary}
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemDate}>
                  {formatDate(item.date)} - {formatTime(item.date)}
                </Text>
                {item.status && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.status === 'validated' ? '#E8F5E9' : '#FFF3E0' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.status === 'validated' ? Colors.success : Colors.primary },
                      ]}
                    >
                      {item.status === 'validated'
                        ? 'Validado'
                        : item.status === 'pending'
                          ? 'Pendiente'
                          : item.status}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.points,
                  { color: item.points > 0 ? Colors.success : Colors.primary },
                ]}
              >
                {item.points > 0 ? '+' : ''}
                {item.points}
              </Text>
            </View>
          ))
        )}
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
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  itemDate: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontFamily: Fonts.caption,
    fontSize: 10,
  },
  points: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    marginLeft: Spacing.s,
  },
});
