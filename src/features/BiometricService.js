
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import api from "./Api";

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

const ACCESS_CONTROL = "BIOMETRY_CURRENT_SET";

const log = (stage, data = {}) => {
  console.log(`[BIOMETRIC] ${stage}`, data);
};

const getErrorDetails = (error) => ({
  message: error?.message,
  code: error?.code,
  name: error?.name,
});

// =====================================================
// CHECK BIOMETRIC AVAILABILITY
// =====================================================

export const checkBiometricAvailability = async () => {
  log("Starting availability check");

  try {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    log("Platform information", {
      platform,
      isNative,
      vaultServer: VAULT_SERVER,
    });

    if (!isNative) {
      return {
        available: false,
        enabled: false,
        error: "Fingerprint login requires the installed mobile app.",
      };
    }

    const availability = await NativeBiometric.isAvailable();

    log("Native biometric availability", availability);

    // isAvailable is the main availability check.
    // Do not require strongBiometryIsAvailable here.
    const available = availability.isAvailable === true;

    let enabled = false;

    try {
      const saved = await NativeBiometric.isCredentialsSaved({
        server: VAULT_SERVER,
      });

      log("Saved credentials status", {
        isSaved: saved.isSaved,
      });

      enabled = saved.isSaved === true;
    } catch (error) {
      log("Credential status check failed", getErrorDetails(error));
    }

    const result = {
      available,
      enabled,
      error: available
        ? ""
        : `Biometrics unavailable. Error code: ${
            availability.errorCode ?? "unknown"
          }`,
      details: {
        biometryType: availability.biometryType,
        authenticationStrength: availability.authenticationStrength,
        strongBiometryIsAvailable:
          availability.strongBiometryIsAvailable,
        deviceIsSecure: availability.deviceIsSecure,
        errorCode: availability.errorCode,
      },
    };

    log("Final biometric status", result);

    return result;
  } catch (error) {
    log("Availability check exception", getErrorDetails(error));

    return {
      available: false,
      enabled: false,
      error: error?.message || "Unable to check biometric availability.",
    };
  }
};

// =====================================================
// ENABLE BIOMETRIC LOGIN
// =====================================================

export const enableBiometricLogin = async () => {
  log("Starting biometric enrollment");

  try {
    log("Requesting enrollment credentials from backend");

    const response = await api.post("/auth/biometric/enroll");

    log("Enrollment API response", {
      status: response.status,
      hasUserId: !!response.data?.userId,
      hasBiometricSecret: !!response.data?.biometricSecret,
    });

    const { userId, biometricSecret } = response.data || {};

    if (!userId || !biometricSecret) {
      throw new Error(
        "Backend did not provide valid biometric credentials."
      );
    }

    log("Saving credentials to native biometric storage");

    await NativeBiometric.setCredentials({
      username: String(userId),
      password: biometricSecret,
      server: VAULT_SERVER,
      accessControl: ACCESS_CONTROL,
    });

    log("Native credential storage completed");

    const saved = await NativeBiometric.isCredentialsSaved({
      server: VAULT_SERVER,
    });

    log("Enrollment verification", {
      isSaved: saved.isSaved,
    });

    if (!saved.isSaved) {
      throw new Error("Biometric credentials were not saved.");
    }

    log("Biometric enrollment completed successfully");

    return true;
  } catch (error) {
    log("Biometric enrollment failed", getErrorDetails(error));

    try {
      await api.delete("/auth/biometric");
      log("Backend enrollment rollback completed");
    } catch (rollbackError) {
      log("Backend rollback failed", getErrorDetails(rollbackError));
    }

    throw error;
  }
};

// =====================================================
// LOGIN WITH BIOMETRICS
// =====================================================

export const loginWithBiometrics = async () => {
  log("Starting fingerprint login");

  try {
    log("Requesting biometric-protected credentials");

    // This call triggers Android's native biometric prompt.
    const credentials = await NativeBiometric.getSecureCredentials({
      server: VAULT_SERVER,
      reason: "Authenticate to access your account",
      title: "Fingerprint Login",
      subtitle: "Welcome back",
      description: "Verify your identity to continue.",
      negativeButtonText: "Cancel",
    });

    log("Native biometric authentication succeeded", {
      hasUsername: !!credentials.username,
      hasPassword: !!credentials.password,
    });

    if (!credentials.username || !credentials.password) {
      throw new Error("No protected biometric credentials found.");
    }

    log("Sending biometric authentication request to backend");

    const response = await api.post("/auth/biometric/login", {
      userId: credentials.username,
      biometricSecret: credentials.password,
    });

    log("Backend biometric login response", {
      status: response.status,
      success: !!response.data,
    });

    log("Fingerprint login completed");

    return response.data;
  } catch (error) {
    log("Fingerprint authentication failed", getErrorDetails(error));
    throw error;
  }
};
