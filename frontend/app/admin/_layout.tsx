import { Stack, Redirect } from 'expo-router';
import { Colors, Fonts, FontSize } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'admin') {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.secondary },
        headerTintColor: Colors.primaryForeground,
        headerTitleStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: FontSize.h3,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Panel Admin' }} />
      <Stack.Screen name="add-points" options={{ title: 'Agregar Puntos' }} />
      <Stack.Screen name="manage-users" options={{ title: 'Editar Usuarios' }} />
      <Stack.Screen name="manage-promos" options={{ title: 'Promociones' }} />
      <Stack.Screen name="validate" options={{ title: 'Validar Canjes' }} />
      <Stack.Screen name="scanner" options={{ title: 'Escanear QR' }} />
    </Stack>
  );
}
