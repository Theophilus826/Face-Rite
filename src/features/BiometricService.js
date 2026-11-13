
import {
  AccessControl,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";

import { Capacitor } from "@capacitor/core";
import authService from "../features/AuthService";

const SERVER =
  import.meta.env.VITE_API_URL ||
  "https://swordgame-5.onrender.com/api";

const VAULT_SERVER = (() => {
  try {
    return new URL(SERVER).host;
  } catch {
    return SERVER.replace(/^https?:\/\//, "").split("/")[0];
  }
})();

const ACCESS_CONTROL = AccessControl.BIOMETRY_CURRENT_SET;

// =====================================================
// CHECK BIOMETRIC AVAILABILITY
// =====================================================

export const checkBiometricAvailability = async () => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return {
        available: false,
        enabled: false,
        error: "Fingerprint login requires the installed mobile app.",
      };
    }

    const availability = await NativeBiometric.isAvailable();

    if (!availability.isAvailable) {
      return {
        available: false,
        enabled: false,
        error: "Fingerprint authentication is unavailable.",
      };
    }

    const saved = await NativeBiometric.isCredentialsSaved({
      server: VAULT_SERVER,
    });

    return {
      available: true,
      enabled: saved.isSaved === true,
      error: "",
      details: availability,
    };
  } catch (error) {
    console.error("[BIOMETRIC] Availability error:", error);

    return {
      available: false,
      enabled: false,
      error: error.message || "Unable to check biometric availability.",
    };
  }
};

// =====================================================
// ENABLE FINGERPRINT LOGIN
// =====================================================

export const enableBiometricLogin = async (
  identifier,
  password
) => {
  try {
    if (!identifier || !password) {
      throw new Error("Please provide your login credentials.");
    }

    if (!Capacitor.isNativePlatform()) {
      throw new Error("Fingerprint login requires the mobile app.");
    }

    await NativeBiometric.deleteCredentials({
      server: VAULT_SERVER,
    });

    await NativeBiometric.setCredentials({
      username: identifier,
      password,
      server: VAULT_SERVER,
      accessControl: ACCESS_CONTROL,
    });

    const saved = await NativeBiometric.isCredentialsSaved({
      server: VAULT_SERVER,
    });

    if (!saved.isSaved) {
      throw new Error("Fingerprint credentials could not be saved.");
    }

    console.log("[BIOMETRIC] Credentials saved successfully.");

    return true;
  } catch (error) {
    console.error("[BIOMETRIC] Enrollment failed:", error);
    throw error;
  }
};

// =====================================================
// LOGIN WITH FINGERPRINT
// =====================================================


export const loginWithBiometrics = async () => {
  try {
    console.log("[BIOMETRIC] Requesting fingerprint...");

    const credentials =
      await NativeBiometric.getSecureCredentials({
        server: VAULT_SERVER,
        reason: "Authenticate to access your account",
        title: "Fingerprint Login",
        subtitle: "Welcome back",
        description: "Verify your identity to continue.",
        negativeButtonText: "Cancel",
      });

    console.log("[BIOMETRIC] Fingerprint verified", {
      hasUsername: !!credentials.username,
      usernameLength: credentials.username?.length,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length,
    });

    if (!credentials.username || !credentials.password) {
      throw new Error("Saved login credentials are missing.");
    }

    console.log("[BIOMETRIC] Calling normal login service...");

    const result = await authService.login({
      identifier: credentials.username.trim(),
      password: credentials.password,
    });

    console.log("[BIOMETRIC] Login successful.");

    return result;

  } catch (error) {
    console.error("[BIOMETRIC] Authentication error:", {
      status: error?.response?.status,
      serverMessage:
        error?.response?.data?.message ||
        error?.response?.data?.error,
      message: error?.message,
      code: error?.code,
    });

    throw error;
  }
};


// =====================================================
// DISABLE FINGERPRINT LOGIN
// =====================================================

export const disableBiometricLogin = async () => {
  try {
    await NativeBiometric.deleteCredentials({
      server: VAULT_SERVER,
    });

    console.log("[BIOMETRIC] Fingerprint login disabled.");

    return true;
  } catch (error) {
    console.error("[BIOMETRIC] Disable failed:", error);
    throw error;
  }
};
