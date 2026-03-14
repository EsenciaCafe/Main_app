import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function QRCodeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mi Código QR</Text>
        <Text style={styles.subtitle}>Muéstralo al personal para identificarte</Text>

        <View testID="qr-code-card" style={styles.qrCard}>
          <View style={styles.qrWrapper}>
            {user?.id ? (
              <QRCode
                value={user.id}
                size={200}
                color={Colors.secondary}
                backgroundColor={Colors.surface}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Feather name="maximize" size={80} color={Colors.border} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pointsRow}>
            <Feather name="award" size={20} color={Colors.accent} />
            <Text style={styles.pointsText}>{user?.points || 0} puntos</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            El personal escaneará tu código para registrar tu visita y agregar puntos a tu cuenta.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.l,
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
    marginBottom: Spacing.xl,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.l,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  qrWrapper: {
    padding: Spacing.l,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.l,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing.m,
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
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.m,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  pointsText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.accent,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F0',
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginTop: Spacing.l,
    gap: Spacing.s,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
