import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { StoreProvider, useStore } from '../store/store';
import { colors } from '../theme';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.accent, text: colors.text, border: colors.border },
};

function Navigator() {
  const { hydrated } = useStore();
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="day/[date]" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="exercise/new" options={{ presentation: 'modal', title: 'Eigene Übung' }} />
      <Stack.Screen name="log/[id]" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StoreProvider>
        <StatusBar style="light" />
        <Navigator />
      </StoreProvider>
    </ThemeProvider>
  );
}
