import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api, ApiError } from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

const futureBenefits = [
  {
    id: 'early-access',
    icon: 'clock',
    title: 'Acceso anticipado',
    description: 'Reserva y prueba productos nuevos antes de su lanzamiento general.',
  },
  {
    id: 'merch',
    icon: 'shopping-bag',
    title: 'Merchandising',
    description: 'Ediciones especiales, coleccionables y drops reservados para miembros.',
  },
  {
    id: 'extras',
    icon: 'star',
    title: 'Beneficios exclusivos',
    description: 'Ventajas y experiencias aun por definir segun evolucione el programa.',
  },
];

export default function ClubScreen() {
  const { user, refreshUser } = useAuth();
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const isMember = Boolean(user?.club_member);
  const isOnWaitlist = Boolean(user?.club_waitlist);
  const membershipTier = user?.membership_tier?.trim() || 'Miembro Club';

  const statusTitle = isMember
    ? membershipTier
    : isOnWaitlist
      ? 'Ya estas en la lista de espera'
      : 'Acceso solo para miembros';

  const statusText = isMember
    ? 'Tu cuenta ya esta marcada como miembro. Aqui apareceran tus beneficios activos, ventajas especiales y futuras renovaciones.'
    : isOnWaitlist
      ? 'Te avisaremos cuando activemos la membresia. La lista de espera sirve para priorizar a quienes quieran entrar primero al Club.'
      : 'La membresia aun no esta abierta. Puedes dejar tu interes ahora para ser de las primeras personas en enterarte del lanzamiento.';

  const statusPill = isMember ? 'Membresia activa' : isOnWaitlist ? 'En espera' : 'Proximamente';

  const handleJoinWaitlist = async () => {
    if (joiningWaitlist || isMember || isOnWaitlist) {
      return;
    }

    try {
      setJoiningWaitlist(true);
      const response = await api.joinClubWaitlist();
      await refreshUser();
      Alert.alert('Lista de espera', response.message);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No pudimos apuntarte ahora mismo.';
      Alert.alert('No se pudo completar', message);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Feather name="star" size={18} color={Colors.primaryForeground} />
            <Text style={styles.heroBadgeText}>Club</Text>
          </View>

          <Text style={styles.title}>Esencia Club</Text>
          <Text style={styles.subtitle}>
            Este espacio sera la puerta de entrada a la membresia premium, con beneficios para las
            personas mas cercanas a la marca.
          </Text>
        </View>

        <View style={[styles.statusCard, isMember ? styles.statusCardActive : styles.statusCardLocked]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, isMember ? styles.statusIconActive : styles.statusIconLocked]}>
              <Feather
                name={isMember ? 'award' : isOnWaitlist ? 'clock' : 'lock'}
                size={24}
                color={isMember ? Colors.primaryForeground : Colors.primary}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>{statusTitle}</Text>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{statusPill}</Text>
          </View>
        </View>

        {!isMember && (
          <View style={styles.waitlistCard}>
            <Text style={styles.waitlistTitle}>Lista de espera</Text>
            <Text style={styles.waitlistText}>
              Si quieres probar el Club desde el principio, apuntate ahora. Esto nos ayuda a medir
              interes real y a preparar el lanzamiento.
            </Text>

            <TouchableOpacity
              testID="club-waitlist-button"
              style={[
                styles.waitlistButton,
                (joiningWaitlist || isOnWaitlist) && styles.waitlistButtonDisabled,
              ]}
              onPress={handleJoinWaitlist}
              disabled={joiningWaitlist || isOnWaitlist}
            >
              {joiningWaitlist ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <>
                  <Feather
                    name={isOnWaitlist ? 'check' : 'arrow-right'}
                    size={18}
                    color={Colors.primaryForeground}
                  />
                  <Text style={styles.waitlistButtonText}>
                    {isOnWaitlist ? 'Ya estas apuntado' : 'Quiero entrar en la lista'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.waitlistHint}>
              La idea inicial es priorizar avisos de lanzamiento, acceso anticipado y primeras
              activaciones del programa.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ideas iniciales de beneficios</Text>
          <Text style={styles.sectionSubtitle}>
            Base provisional para definir la propuesta de valor del Club.
          </Text>
        </View>

        {futureBenefits.map((benefit) => (
          <View key={benefit.id} style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Feather name={benefit.icon as keyof typeof Feather.glyphMap} size={20} color={Colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDescription}>{benefit.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Feather name="info" size={18} color={Colors.primary} />
          <Text style={styles.noteText}>
            El siguiente paso natural seria conectar membresias de pago, niveles y automatizaciones
            para desbloquear esta zona solo a clientes con acceso activo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xxl,
  },
  hero: {
    marginBottom: Spacing.l,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.m,
  },
  heroBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primaryForeground,
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
    marginTop: Spacing.s,
    lineHeight: 24,
  },
  statusCard: {
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    marginBottom: Spacing.l,
    ...Shadows.medium,
  },
  statusCardActive: {
    backgroundColor: Colors.secondary,
  },
  statusCardLocked: {
    backgroundColor: Colors.surface,
  },
  statusHeader: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconActive: {
    backgroundColor: Colors.success,
  },
  statusIconLocked: {
    backgroundColor: '#FFF3E0',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: Spacing.m,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  statusPillText: {
    fontFamily: Fonts.caption,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  waitlistCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    marginBottom: Spacing.l,
    borderWidth: 1,
    borderColor: '#F0DFC8',
  },
  waitlistTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  waitlistText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.s,
  },
  waitlistButton: {
    marginTop: Spacing.m,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
  },
  waitlistButtonDisabled: {
    opacity: 0.7,
  },
  waitlistButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primaryForeground,
  },
  waitlistHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.s,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    fontFamily: Fonts.subheading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Shadows.soft,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.s,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  benefitDescription: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
    backgroundColor: '#FFF8F0',
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginTop: Spacing.m,
  },
  noteText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
