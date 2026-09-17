import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveExpoDevHost(): string | undefined {
  if (!__DEV__ || !Constants.expoConfig?.hostUri) return undefined;

  try {
    return new URL(`http://${Constants.expoConfig.hostUri}`).hostname;
  } catch {
    return undefined;
  }
}

/** Resolve the backend base URL for simulators, emulators, and devices. */
function resolveApiBaseUrl(): string {
  const configured = (Constants.expoConfig?.extra as any)?.apiBaseUrl as
    | string
    | undefined;
  if (configured && !configured.includes("localhost")) {
    return configured;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }
  const expoDevHost = resolveExpoDevHost();
  if (expoDevHost && expoDevHost !== "localhost") {
    return `http://${expoDevHost}:8080`;
  }
  return configured ?? "http://localhost:8080";
}

export const config = {
  apiBaseUrl: resolveApiBaseUrl(),
  // Phone/OTP sign-in is built but hidden until SMS (DLT/Firebase) is set up.
  // Flip to true to re-enable the "Continue with Mobile Number" flow.
  phoneAuthEnabled:
    (Constants.expoConfig?.extra as any)?.phoneAuthEnabled ?? false,
  googleAuthEnabled:
    (Constants.expoConfig?.extra as any)?.googleAuthEnabled ?? true,
  googleMock: (Constants.expoConfig?.extra as any)?.googleMock ?? true,
  google: {
    iosClientId: (Constants.expoConfig?.extra as any)?.googleIosClientId as
      | string
      | undefined,
    androidClientId: (Constants.expoConfig?.extra as any)
      ?.googleAndroidClientId as string | undefined,
    webClientId: (Constants.expoConfig?.extra as any)?.googleWebClientId as
      | string
      | undefined,
  },
};
