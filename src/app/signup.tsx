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

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) return;
    setError("");

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(name, email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your account.");
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start tracking your health progress.</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                accessibilityLabel="Name"
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#8792A2"
                returnKeyType="next"
                style={styles.input}
                value={name}
              />

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
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#8792A2"
                returnKeyType="next"
                secureTextEntry
                style={styles.input}
                value={password}
              />

              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                accessibilityLabel="Confirm password"
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleSubmit}
                placeholder="Enter your password again"
                placeholderTextColor="#8792A2"
                returnKeyType="go"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
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
                  <Text style={styles.buttonText}>Create account</Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account?</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/login")}
                  hitSlop={8}
                >
                  <Text style={styles.loginLink}>Sign in</Text>
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
  form: { marginTop: 26, gap: 12 },
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
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },
  loginPrompt: { color: "#667085", fontSize: 14 },
  loginLink: { color: "#1675D1", fontSize: 14, fontWeight: "700" },
});
