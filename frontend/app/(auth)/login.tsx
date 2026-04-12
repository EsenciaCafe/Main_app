import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Fonts, Shadows } from '../../src/constants/theme';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_rewards-esencia/artifacts/4dh7zadu_IMG_2592.png';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para acumular puntos y recompensas</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text testID="login-error" style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            testID="login-submit-btn"
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="go-to-register-btn"
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 200,
    height: 80,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.s,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.s,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  errorText: {
    fontFamily: Fonts.body,
    color: Colors.error,
    fontSize: FontSize.small,
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
    height: 56,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: FontSize.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  button: {
    height: 56,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.l,
    ...Shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primaryForeground,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: Spacing.l,
    padding: Spacing.m,
  },
  linkText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  linkBold: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
  },
});
