import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  useFonts as useFraunces,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useAuth } from "@/store/auth";
import { purgeOldProof, localDateString } from "@/storage/secureProof";
import { Button } from "@/components/Button";
import { colors, fonts, spacing } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFraunces({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const bootstrap = useAuth((s) => s.bootstrap);
  const status = useAuth((s) => s.status);
  const userId = useAuth((s) => s.userId);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === "authenticated" && userId != null) {
      purgeOldProof(userId, localDateString()).catch(() => {});
    }
  }, [status, userId]);

  useEffect(() => {
    if (fontsLoaded && status !== "initializing") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === "initializing") {
    return null;
  }

  if (status === "connectionError") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.connectionSafe}>
          <View style={styles.connectionContent}>
            <Text style={styles.connectionTitle}>Could not verify your session</Text>
            <Text style={styles.connectionBody}>
              Check your connection and try again. Your saved session has not
              been removed.
            </Text>
            <Button label="Try again" onPress={bootstrap} />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={status === "authenticated"}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status === "unauthenticated"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  connectionSafe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  connectionContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  connectionTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  connectionBody: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
});
