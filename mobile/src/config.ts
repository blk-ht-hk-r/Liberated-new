import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolve the backend base URL. Android emulators cannot reach the host via
 * "localhost" - they use 10.0.2.2. For a physical device set apiBaseUrl in
 * app.json to your machine's LAN IP (e.g. http://192.168.1.20:8080).
 */
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
  return configured ?? "http://localhost:8080";
}

export const config = {
  apiBaseUrl: resolveApiBaseUrl(),
  googleMock: (Constants.expoConfig?.extra as any)?.googleMock ?? true,
};
