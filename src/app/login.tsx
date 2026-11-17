import { useState } from "react";
import {
  ActivityIndicator,
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
import { useAuthStore } from "@/stores/auth";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) return;
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>H</Text>
            </View>
            <Text style={styles.eyebrow}>HEALTH PROGRESS TRACKER</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your progress.</Text>
            <Text style={styles.demoHint}>
              Demo account: demo@health.com / password123
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8792A2"
                returnKeyType="next"
                style={styles.input}
                value={email}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                placeholder="Enter your password"
                placeholderTextColor="#8792A2"
                returnKeyType="go"
                secureTextEntry
                style={styles.input}
                value={password}
              />

              {!!error && (
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !isSubmitting && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
                )}
              </Pressable>
              <View style={styles.signupRow}>
                <Text style={styles.signupPrompt}>New to Health Progress Tracker?</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/signup")}
                  hitSlop={8}
                >
                  <Text style={styles.signupLink}>Create account</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#17324D",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3FF",
    marginBottom: 24,
  },
  brandMarkText: { color: "#1675D1", fontSize: 23, fontWeight: "800" },
  eyebrow: {
    color: "#1675D1",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: { color: "#172B4D", fontSize: 30, fontWeight: "700" },
  subtitle: { color: "#667085", fontSize: 15, marginTop: 8, lineHeight: 22 },
  demoHint: { color: "#667085", fontSize: 12, marginTop: 12 },
  form: { marginTop: 30, gap: 12 },
  label: { color: "#344054", fontSize: 14, fontWeight: "600", marginTop: 4 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 15,
    color: "#172B4D",
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  error: { color: "#B42318", fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#1675D1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },
  signupPrompt: { color: "#667085", fontSize: 14 },
  signupLink: { color: "#1675D1", fontSize: 14, fontWeight: "700" },
});
