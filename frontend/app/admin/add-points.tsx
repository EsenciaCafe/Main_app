import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function AddPointsScreen() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchCustomers(search.trim());
      setCustomers(results);
      if (results.length === 0) {
        Alert.alert('Sin resultados', 'No se encontraron clientes');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedCustomer || !points || !reason) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Alert.alert('Error', 'Los puntos deben ser un número positivo');
      return;
    }
    setLoading(true);
    try {
      const result = await api.addPoints(selectedCustomer.id, pointsNum, reason.trim());
      Alert.alert(
        'Puntos Agregados',
        `Se agregaron ${pointsNum} puntos a ${selectedCustomer.name}.\nNuevo total: ${result.customer.points} puntos`
      );
      setSelectedCustomer({ ...selectedCustomer, points: result.customer.points });
      setPoints('');
      setReason('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickReasons = ['Café', 'Desayuno', 'Bebida Especial', 'Mini Pancakes'];

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
        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            testID="search-customer-input"
            style={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity testID="search-btn" style={styles.searchButton} onPress={handleSearch}>
            {searching ? (
              <ActivityIndicator color={Colors.primaryForeground} size="small" />
            ) : (
              <Feather name="search" size={20} color={Colors.primaryForeground} />
            )}
          </TouchableOpacity>
        </View>

        {/* Customer Results */}
        {customers.length > 0 && !selectedCustomer && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsLabel}>Resultados</Text>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                testID={`customer-result-${c.id}`}
                style={styles.customerResult}
                onPress={() => setSelectedCustomer(c)}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {c.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerEmail}>{c.email}</Text>
                </View>
                <Text style={styles.customerPoints}>{c.points} pts</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Customer */}
        {selectedCustomer && (
          <>
            <View testID="selected-customer-card" style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                  <Text style={styles.customerEmail}>{selectedCustomer.email}</Text>
                </View>
                <TouchableOpacity testID="change-customer-btn" onPress={() => setSelectedCustomer(null)}>
                  <Feather name="x" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.currentPoints}>
                <Feather name="award" size={16} color={Colors.accent} />
                <Text style={styles.currentPointsText}>
                  Puntos actuales: <Text style={styles.pointsBold}>{selectedCustomer.points}</Text>
                </Text>
              </View>
            </View>

            {/* Points Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Puntos a agregar</Text>
              <TextInput
                testID="points-input"
                style={styles.input}
                placeholder="Ej: 1, 2, 5"
                placeholderTextColor={Colors.textSecondary}
                value={points}
                onChangeText={setPoints}
                keyboardType="numeric"
              />
            </View>

            {/* Quick Reasons */}
            <Text style={styles.label}>Razón</Text>
            <View style={styles.quickReasons}>
              {quickReasons.map((r) => (
                <TouchableOpacity
                  key={r}
                  testID={`reason-${r}`}
                  style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              testID="reason-input"
              style={[styles.input, { marginTop: Spacing.s }]}
              placeholder="O escribe una razón personalizada..."
              placeholderTextColor={Colors.textSecondary}
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity
              testID="add-points-submit-btn"
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleAddPoints}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="plus-circle" size={20} color={Colors.primaryForeground} />
                  <Text style={styles.submitText}>Agregar Puntos</Text>
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
  customerResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  customerAvatarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.accent,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  customerEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  customerPoints: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.accent,
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
    marginBottom: Spacing.m,
  },
  currentPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.s,
    padding: Spacing.s,
  },
  currentPointsText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  pointsBold: {
    fontFamily: Fonts.bodyBold,
    color: Colors.accent,
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
  quickReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    marginBottom: Spacing.s,
  },
  reasonChip: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  reasonChipActive: {
    backgroundColor: Colors.secondary,
  },
  reasonChipText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  reasonChipTextActive: {
    color: Colors.primaryForeground,
  },
  submitButton: {
    height: 56,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.s,
    marginTop: Spacing.l,
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
