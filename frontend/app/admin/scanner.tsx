import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

export default function ScannerScreen() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  const handleLookup = async () => {
    const value = customerId.trim();

    if (!value) {
      Alert.alert('Error', 'Ingresa el ID del cliente o el UID del llavero');
      return;
    }

    setLoading(true);
    try {
      let foundCustomer = null;

      try {
        foundCustomer = await api.getCustomer(value);
      } catch {
        foundCustomer = await api.getCustomerByUid(value);
      }

      setCustomer(foundCustomer);
    } catch {
      Alert.alert('No encontrado', 'No se encontro un cliente con ese ID o UID');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!points || !reason) {
      Alert.alert('Error', 'Completa puntos y razon');
      return;
    }

    setAdding(true);
    try {
      const parsedPoints = Number.parseInt(points, 10);
      if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
        Alert.alert('Error', 'Ingresa una cantidad valida de puntos');
        setAdding(false);
        return;
      }

      const result = await api.addPoints(customer.id, parsedPoints, reason.trim());
      Alert.alert('Puntos Agregados', `${points} puntos agregados a ${customer.name}`);
      setCustomer({ ...customer, points: result.customer.points });
      setPoints('');
      setReason('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setAdding(false);
    }
  };

  const quickReasons = ['Cafe', 'Desayuno', 'Bebida Especial', 'Mini Pancakes'];

  return (
    <View style={styles.container}>
      {!customer ? (
        <View style={styles.scanSection}>
          <View style={styles.iconCircle}>
            <Feather name="camera" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.scanTitle}>Identificar Cliente</Text>
          <Text style={styles.scanSubtitle}>
            Ingresa el ID del cliente o el UID del llavero para identificarlo
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              testID="customer-id-input"
              style={styles.idInput}
              placeholder="ID del cliente o UID"
              placeholderTextColor={Colors.textSecondary}
              value={customerId}
              onChangeText={setCustomerId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              testID="lookup-btn"
              style={styles.lookupButton}
              onPress={handleLookup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primaryForeground} size="small" />
              ) : (
                <Feather name="search" size={20} color={Colors.primaryForeground} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="go-to-search-btn"
            style={styles.alternativeButton}
            onPress={() => router.push('/admin/add-points')}
          >
            <Text style={styles.alternativeText}>O buscar por nombre/email</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.customerSection}>
          <View testID="scanned-customer-card" style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {customer.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            <View style={styles.pointsBadge}>
              <Feather name="award" size={16} color={Colors.accent} />
              <Text style={styles.pointsText}>{customer.points} puntos</Text>
            </View>
          </View>

          <View style={styles.addSection}>
            <Text style={styles.addTitle}>Agregar Puntos</Text>

            <TextInput
              testID="scanner-points-input"
              style={styles.input}
              placeholder="Puntos a agregar"
              placeholderTextColor={Colors.textSecondary}
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
            />

            <View style={styles.quickReasons}>
              {quickReasons.map((currentReason) => (
                <TouchableOpacity
                  key={currentReason}
                  style={[styles.reasonChip, reason === currentReason && styles.reasonChipActive]}
                  onPress={() => setReason(currentReason)}
                >
                  <Text style={[styles.reasonText, reason === currentReason && styles.reasonTextActive]}>
                    {currentReason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              testID="scanner-add-points-btn"
              style={[styles.addButton, adding && styles.buttonDisabled]}
              onPress={handleAddPoints}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="plus-circle" size={20} color={Colors.primaryForeground} />
                  <Text style={styles.addButtonText}>Agregar Puntos</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="scan-another-btn"
              style={styles.scanAnotherButton}
              onPress={() => {
                setCustomer(null);
                setCustomerId('');
              }}
            >
              <Feather name="refresh-cw" size={16} color={Colors.primary} />
              <Text style={styles.scanAnotherText}>Escanear Otro Cliente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.containerPadding },
  scanSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  scanTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scanSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.s,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s,
  },
  idInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  lookupButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeButton: {
    marginTop: Spacing.l,
    padding: Spacing.m,
  },
  alternativeText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  customerSection: {
    flex: 1,
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.l,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.l,
    ...Shadows.soft,
  },
  customerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h2,
    color: Colors.accent,
  },
  customerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  customerEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginTop: Spacing.m,
  },
  pointsText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.accent,
  },
  addSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    ...Shadows.soft,
  },
  addTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.m,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.m,
  },
  quickReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    marginBottom: Spacing.m,
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
  reasonText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  reasonTextActive: {
    color: Colors.primaryForeground,
  },
  addButton: {
    height: 56,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.s,
    ...Shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primaryForeground,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    marginTop: Spacing.m,
    padding: Spacing.m,
  },
  scanAnotherText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
});
