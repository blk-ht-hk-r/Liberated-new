import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { Button } from "@/components/Button";
import { useAuth } from "@/store/auth";
import { apiErrorMessage } from "@/api/client";
import { config } from "@/config";
import { colors, fonts, radius, shadow, spacing } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

type Screen = "welcome" | "phone" | "email";

export default function Login() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  // phone
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const auth = useAuth();

  // Google OAuth request. In mock mode we skip the real provider entirely.
  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: config.google.iosClientId,
    androidClientId: config.google.androidClientId,
    webClientId: config.google.webClientId,
  });

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // Complete Google sign-in once the provider returns an id_token.
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken =
        googleResponse.params?.id_token ??
        googleResponse.authentication?.idToken;
      if (idToken) {
        run(async () => {
          await auth.loginWithGoogle(idToken);
          router.replace("/(app)/home");
        });
      }
    } else if (googleResponse?.type === "error") {
      setError("Google sign-in failed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const submitEmail = () =>
    run(async () => {
      if (isRegister) {
        await auth.register(email.trim(), password, displayName.trim());
      } else {
        await auth.loginWithEmail(email.trim(), password);
      }
      router.replace("/(app)/home");
    });

  const sendOtp = () =>
    run(async () => {
      await auth.requestOtp(phone.trim());
      setOtpSent(true);
    });

  const verifyOtp = () =>
    run(async () => {
      await auth.verifyOtp(phone.trim(), code.trim());
      router.replace("/(app)/home");
    });

  const googleSignIn = () =>
    run(async () => {
      if (config.googleMock) {
        await auth.loginWithGoogle(`mock-token-${Date.now()}`);
        router.replace("/(app)/home");
        return;
      }
      if (
        !config.google.iosClientId &&
        !config.google.androidClientId &&
        !config.google.webClientId
      ) {
        setError("Add Google OAuth client IDs to enable live sign-in.");
        return;
      }
      await promptGoogle();
    });

  const appleSignIn = () =>
    run(async () => {
      if (config.appleMock) {
        await auth.loginWithApple(`mock-apple-${Date.now()}`);
        router.replace("/(app)/home");
        return;
      }
      if (Platform.OS !== "ios") {
        setError("Apple sign-in is only available on iOS devices.");
        return;
      }
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        setError("Apple sign-in is not available on this device.");
        return;
      }
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          setError("Apple did not return an identity token.");
          return;
        }
        const fullName = [
          credential.fullName?.givenName,
          credential.fullName?.familyName,
        ]
          .filter(Boolean)
          .join(" ");
        await auth.loginWithApple(
          credential.identityToken,
          fullName || undefined,
        );
        router.replace("/(app)/home");
      } catch (e: any) {
        if (e?.code === "ERR_REQUEST_CANCELED") return;
        throw e;
      }
    });

  const skipLogin = () =>
    run(async () => {
      await auth.enableOfflineMode();
      router.replace("/(app)/home");
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandBar}>
          <Text style={styles.brand}>LIBERATED</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {screen === "welcome" && (
              <>
                <Text style={styles.heading}>Welcome back.</Text>
                <Text style={styles.headingAccent}>Breathe.</Text>

                <View style={styles.buttonGroup}>
                  <SocialButton
                    icon="logo-google"
                    label="Continue with Google"
                    variant="light"
                    onPress={googleSignIn}
                    loading={loading}
                  />
                  <SocialButton
                    icon="logo-apple"
                    label="Continue with Apple"
                    variant="dark"
                    onPress={appleSignIn}
                  />
                  <SocialButton
                    icon="call"
                    label="Continue with Mobile Number"
                    variant="teal"
                    onPress={() => {
                      setError(null);
                      setScreen("phone");
                    }}
                  />
                </View>

                <Pressable
                  onPress={() => {
                    setError(null);
                    setScreen("email");
                  }}
                  style={styles.switch}
                >
                  <Text style={styles.switchText}>Continue with email</Text>
                </Pressable>

                {__DEV__ && (
                  <Pressable onPress={skipLogin} style={styles.skip}>
                    <Ionicons
                      name="flash-outline"
                      size={16}
                      color={colors.inkMuted}
                    />
                    <Text style={styles.skipText}>
                      Skip login · offline demo
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {screen === "phone" && (
              <>
                <BackLink onPress={() => setScreen("welcome")} />
                <Text style={styles.heading}>Your number</Text>
                <Text style={styles.sub}>
                  We'll text you a one-time code. No passwords.
                </Text>
                <View style={styles.form}>
                  <Field
                    label="Mobile number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 555 000 1234"
                    keyboardType="phone-pad"
                    editable={!otpSent}
                  />
                  {otpSent && (
                    <Field
                      label="Verification code"
                      value={code}
                      onChangeText={setCode}
                      placeholder="000000"
                      keyboardType="number-pad"
                    />
                  )}
                  {!otpSent ? (
                    <Button
                      label="Send code"
                      onPress={sendOtp}
                      loading={loading}
                    />
                  ) : (
                    <>
                      <Button
                        label="Verify & continue"
                        onPress={verifyOtp}
                        loading={loading}
                      />
                      <Pressable
                        onPress={() => setOtpSent(false)}
                        style={styles.switch}
                      >
                        <Text style={styles.switchText}>Change number</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </>
            )}

            {screen === "email" && (
              <>
                <BackLink onPress={() => setScreen("welcome")} />
                <Text style={styles.heading}>
                  {isRegister ? "Create account" : "Sign in"}
                </Text>
                <View style={styles.form}>
                  {isRegister && (
                    <Field
                      label="Name"
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Your name"
                    />
                  )}
                  <Field
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Field
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                  <Button
                    label={isRegister ? "Create account" : "Sign in"}
                    onPress={submitEmail}
                    loading={loading}
                    style={{ marginTop: spacing.sm }}
                  />
                  <Pressable
                    onPress={() => setIsRegister((v) => !v)}
                    style={styles.switch}
                  >
                    <Text style={styles.switchText}>
                      {isRegister
                        ? "Already have an account? Sign in"
                        : "New here? Create an account"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Text style={styles.legal}>
            By continuing you commit to yourself, not to us. Your daily proof
            never leaves your phone.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  icon,
  label,
  variant,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  variant: "light" | "dark" | "teal";
  onPress: () => void;
  loading?: boolean;
}) {
  const isLight = variant === "light";
  const fg = isLight ? "#1A1A1A" : colors.onDark;
  const bg =
    variant === "light"
      ? "#FFFFFF"
      : variant === "dark"
        ? "#1A1A1A"
        : colors.brass;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.social,
        { backgroundColor: bg },
        isLight && styles.socialLightBorder,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={fg} style={styles.socialIcon} />
      <Text style={[styles.socialLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.backLink}>
      <Ionicons name="chevron-back" size={18} color={colors.brass} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  brandBar: { alignItems: "center", paddingVertical: spacing.xl },
  brand: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: 4,
    color: colors.onDark,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.paperElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.soft,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    textAlign: "center",
  },
  headingAccent: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.brass,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  buttonGroup: { gap: spacing.md },
  social: {
    height: 54,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  socialLightBorder: { borderWidth: 1, borderColor: colors.line },
  socialIcon: { marginRight: spacing.sm },
  socialLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15 },
  pressed: { transform: [{ scale: 0.98 }] },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  form: { gap: spacing.md, marginTop: spacing.sm },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.inkMuted,
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#FFFFFF",
  },
  switch: { alignItems: "center", paddingVertical: spacing.md },
  switchText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.brass,
  },
  skip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.brass,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: "center",
  },
  legal: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.onDark,
    opacity: 0.6,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});
