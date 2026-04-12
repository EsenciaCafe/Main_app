import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function ManagePromosScreen() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', points_required: '', category: 'coffee', icon: 'coffee' });

  const loadData = useCallback(async () => {
    try {
      const promos = await api.getPromotions();
      setPromotions(promos);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.points_required) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const parsedPoints = Number.parseInt(form.points_required, 10);
      if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
        Alert.alert('Error', 'Los puntos requeridos deben ser un numero positivo');
        setLoading(false);
        return;
      }
      await api.createPromotion({
        title: form.title.trim(),
        description: form.description.trim(),
        points_required: parsedPoints,
        category: form.category,
        icon: form.icon,
      });
      setShowModal(false);
      setForm({ title: '', description: '', points_required: '', category: 'coffee', icon: 'coffee' });
      await loadData();
      Alert.alert('Éxito', 'Promoción creada correctamente');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (promo: any) => {
    Alert.alert('Desactivar Promoción', `¿Desactivar "${promo.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePromotion(promo.id);
            await loadData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const categories = ['coffee', 'food', 'special'];
  const icons = ['coffee', 'gift', 'star', 'heart'];

  const iconMap: Record<string, string> = { coffee: 'coffee', gift: 'gift', star: 'star', heart: 'heart' };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {promotions.map((promo) => (
          <View key={promo.id} testID={`admin-promo-${promo.id}`} style={styles.promoCard}>
            <View style={styles.promoHeader}>
              <View style={styles.promoIcon}>
                <Feather name={(iconMap[promo.icon] || 'star') as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.promoInfo}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoCategory}>{promo.category} · {promo.points_required} pts</Text>
              </View>
              <TouchableOpacity testID={`delete-promo-${promo.id}`} onPress={() => handleDelete(promo)}>
                <Feather name="trash-2" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.promoDesc}>{promo.description}</Text>
          </View>
        ))}

        {promotions.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="gift" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No hay promociones activas</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity testID="create-promo-fab" style={styles.fab} onPress={() => setShowModal(true)}>
        <Feather name="plus" size={24} color={Colors.primaryForeground} />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Promoción</Text>
              <TouchableOpacity testID="close-modal-btn" onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  testID="promo-title-input"
                  style={styles.input}
                  placeholder="Ej: Café Gratis"
                  placeholderTextColor={Colors.textSecondary}
                  value={form.title}
                  onChangeText={(v) => setForm(p => ({ ...p, title: v }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  testID="promo-desc-input"
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: Spacing.m }]}
                  placeholder="Describe la promoción..."
                  placeholderTextColor={Colors.textSecondary}
                  value={form.description}
                  onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Puntos Requeridos</Text>
                <TextInput
                  testID="promo-points-input"
                  style={styles.input}
                  placeholder="Ej: 10"
                  placeholderTextColor={Colors.textSecondary}
                  value={form.points_required}
                  onChangeText={(v) => setForm(p => ({ ...p, points_required: v }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.chipRow}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, form.category === c && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, category: c }))}
                    >
                      <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Icono</Text>
                <View style={styles.chipRow}>
                  {icons.map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.iconChip, form.icon === i && styles.iconChipActive]}
                      onPress={() => setForm(p => ({ ...p, icon: i }))}
                    >
                      <Feather name={i as any} size={20} color={form.icon === i ? Colors.primaryForeground : Colors.textPrimary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                testID="create-promo-submit-btn"
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.primaryForeground} />
                ) : (
                  <Text style={styles.submitText}>Crear Promoción</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.containerPadding, paddingBottom: 100 },
  promoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.s,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  promoInfo: { flex: 1 },
  promoTitle: { fontFamily: Fonts.bodyBold, fontSize: FontSize.body, color: Colors.textPrimary },
  promoCategory: { fontFamily: Fonts.caption, fontSize: FontSize.caption, color: Colors.textSecondary, textTransform: 'capitalize' },
  promoDesc: { fontFamily: Fonts.body, fontSize: FontSize.small, color: Colors.textSecondary, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2 },
  emptyText: { fontFamily: Fonts.body, fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.m },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.l,
    borderTopRightRadius: BorderRadius.l,
    padding: Spacing.containerPadding,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  modalTitle: { fontFamily: Fonts.heading, fontSize: FontSize.h2, color: Colors.textPrimary },
  inputGroup: { marginBottom: Spacing.m },
  label: { fontFamily: Fonts.caption, fontSize: FontSize.small, color: Colors.textPrimary, marginBottom: Spacing.s },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s },
  chip: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  chipActive: { backgroundColor: Colors.secondary },
  chipText: { fontFamily: Fonts.caption, fontSize: FontSize.small, color: Colors.textPrimary, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.primaryForeground },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChipActive: { backgroundColor: Colors.secondary },
  submitButton: {
    height: 56,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.m,
    marginBottom: Spacing.l,
  },
  buttonDisabled: { opacity: 0.7 },
  submitText: { fontFamily: Fonts.bodyBold, fontSize: FontSize.body, color: Colors.primaryForeground },
});
