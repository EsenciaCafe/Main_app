import { Stack } from 'expo-router';
import { Colors, Fonts, FontSize } from '../../src/constants/theme';

export default function AdminLayout() {
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
      <Stack.Screen name="manage-promos" options={{ title: 'Promociones' }} />
      <Stack.Screen name="validate" options={{ title: 'Validar Canjes' }} />
      <Stack.Screen name="scanner" options={{ title: 'Escanear QR' }} />
    </Stack>
  );
}
