import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { colors } from "@/theme";

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
  const initializing = useAuth((s) => s.initializing);
  const token = useAuth((s) => s.token);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    bootstrap();
    // Purge any private proof left over from previous days on launch.
    purgeOldProof(localDateString()).catch(() => {});
  }, [bootstrap]);

  useEffect(() => {
    if (fontsLoaded && !initializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, initializing]);

  useEffect(() => {
    if (initializing || !fontsLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(app)/home");
    }
  }, [token, initializing, fontsLoaded, segments, router]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar style="dark" />
      <Slot />
    </GestureHandlerRootView>
  );
}
