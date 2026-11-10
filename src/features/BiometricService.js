
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import api from "./Api";

const SERVER =
  import.meta.env.VITE_API_URL || "https://swordgame-5.onrender.com/api";

const VAULT_SERVER = (() => {
  try {
    return new URL(SERVER).host;
  } catch (error) {
    return SERVER.replace(/^https?:\/\//, "").split("/")[0];
  }
})();

const ACCESS_CONTROL = "BIOMETRY_CURRENT_SET";

export const checkBiometricAvailability = async () => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return {
        available: false,
        enabled: false,
        error: "Fingerprint login requires the Android app.",
      };
    }

    const availability = await NativeBiometric.isAvailable();

    const saved = await NativeBiometric.isCredentialsSaved({
      server: VAULT_SERVER,
    });

    return {
      available:
        availability.isAvailable &&
        availability.strongBiometryIsAvailable,
      enabled: saved.isSaved,
      error: availability.isAvailable
        ? ""
        : "No supported biometric authentication is available.",
    };
  } catch (error) {
    console.error("Biometric availability error:", error);

    return {
      available: false,
      enabled: false,
      error: error.message || "Unable to check fingerprint availability.",
    };
  }
};

// Register a biometric credential AFTER normal password login.
export const enableBiometricLogin = async () => {
  // Request a one-time enrollment credential from Express.
  const response = await api.post("/auth/biometric/enroll");

  const { userId, biometricSecret } = response.data;

  if (!userId || !biometricSecret) {
    throw new Error("Backend did not provide a biometric credential.");
  }

  try {
    // Store the secret behind Android biometric authentication.
    await NativeBiometric.setCredentials({
      username: userId,
      password: biometricSecret,
      server: VAULT_SERVER,
      accessControl: ACCESS_CONTROL,
    });

    // Verify that the credential was saved.
    const saved = await NativeBiometric.isCredentialsSaved({
      server: VAULT_SERVER,
    });

    if (!saved.isSaved) {
      throw new Error("Biometric credential was not saved.");
    }

    return true;
  } catch (error) {
    // Roll back server enrollment if secure storage fails.
    try {
      await api.delete("/auth/biometric");
    } catch (revokeError) {
      console.error("Biometric enrollment rollback failed:", revokeError);
    }

    throw error;
  }
};

// Authenticate using the Android biometric-protected vault.
export const loginWithBiometrics = async () => {
  const credentials = await NativeBiometric.getSecureCredentials({
    server: VAULT_SERVER,
    reason: "Authenticate to access your account",
    title: "Fingerprint Login",
    subtitle: "Welcome back",
    description: "Verify your identity to continue.",
    negativeButtonText: "Cancel",
  });

  if (!credentials.username || !credentials.password) {
    throw new Error("No saved biometric credentials found.");
  }

  // Server validates the secret and issues a fresh session.
  const response = await api.post("/auth/biometric/login", {
    userId: credentials.username,
    biometricSecret: credentials.password,
  });

  return response.data;
};


