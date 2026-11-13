
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import { loginUser, reset, sendMood, setSession } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";
import Mode from "../component/Mode";
import authApi from "../features/AuthService";

import {
  checkBiometricAvailability,
  enableBiometricLogin,
  loginWithBiometrics,
} from "../features/BiometricService";

export default function Login() {
  // =====================================================
  // STATE
  // =====================================================

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showMode, setShowMode] = useState(false);

  const [allowBiometrics, setAllowBiometrics] = useState(null);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricStatusMessage, setBiometricStatusMessage] = useState("");
  const biometricAutoPrompted = useRef(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, message } = useSelector(
    (state) => state.auth
  );

  const busy = submitting || isLoading || biometricLoading;

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  const getErrorMessage = (error) => {
    if (typeof error === "string") return error;

    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Authentication failed. Please try again."
    );
  };

  // =====================================================
  // BIOMETRIC AVAILABILITY
  // =====================================================

  const refreshBiometricStatus = async () => {
    console.log("[LOGIN] Checking biometric availability...");

    try {
      const status = await checkBiometricAvailability();

      console.log("[LOGIN] Biometric status:", status);

      setBiometricAvailable(status.available);
      setBiometricEnabled(status.enabled);
      setBiometricStatusMessage(status.error || "");

      return status;
    } catch (error) {
      console.error("[LOGIN] Biometric check failed:", error);

      setBiometricAvailable(false);
      setBiometricEnabled(false);
      setBiometricStatusMessage(getErrorMessage(error));

      return {
        available: false,
        enabled: false,
        error: getErrorMessage(error),
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeBiometrics = async () => {
      console.log("[LOGIN] Initializing biometric authentication");

      try {
        const status = await checkBiometricAvailability();

        console.log("[LOGIN] Initialization result:", status);

        if (!mounted) return;

        setBiometricAvailable(status.available);
        setBiometricEnabled(status.enabled);
        setBiometricStatusMessage(status.error || "");
      } catch (error) {
        console.error("[LOGIN] Initialization error:", error);

        if (!mounted) return;

        setBiometricAvailable(false);
        setBiometricEnabled(false);
        setBiometricStatusMessage(getErrorMessage(error));
      } finally {
        if (mounted) {
          setBiometricChecking(false);
        }
      }
    };

    initializeBiometrics();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // REDUX ERROR HANDLING
  // =====================================================

  useEffect(() => {
    if (isError) {
      toast.error(message || "Login failed.");
    }

    dispatch(reset());
  }, [isError, message, dispatch]);

  // =====================================================
  // NORMAL PASSWORD LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (busy) return;

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
      toast.error("Please enter email/phone and password.");
      return;
    }

    console.log("[LOGIN] Starting password authentication");

    setSubmitting(true);

    try {
      const authenticatedUser = await dispatch(
        loginUser({
          identifier: cleanIdentifier,
          password,
        })
      ).unwrap();

      console.log("[LOGIN] Password authentication completed");

      if (!authenticatedUser || !authApi.getToken()) {
        throw new Error("Login did not create a valid session.");
      }

      toast.success("Login successful.");

      // Refresh biometric status after login.
      const status = await refreshBiometricStatus();

      // Already registered.
      if (status.enabled) {
        console.log("[LOGIN] Biometrics already enabled");

        setShowMode(true);
        return;
      }

      // Device does not support biometrics.
      if (!status.available) {
        console.log("[LOGIN] Biometrics unavailable");

        toast.info(
          status.error || "Fingerprint authentication is unavailable."
        );

        setShowMode(true);
        return;
      }

      // User previously selected Allow.
      if (allowBiometrics === true) {
        console.log("[LOGIN] User accepted fingerprint enrollment");

        await enableBiometricLogin();

        const finalStatus = await refreshBiometricStatus();

        if (!finalStatus.enabled) {
          throw new Error(
            "Fingerprint registration could not be confirmed."
          );
        }

        toast.success("Fingerprint login enabled successfully.");

        setShowMode(true);
        return;
      }

      // Ask user to enable fingerprint.
      console.log("[LOGIN] Showing biometric setup modal");

      setShowBiometricSetup(true);
    } catch (error) {
      console.error("[LOGIN] Password login failed:", error);

      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // FINGERPRINT LOGIN
  // =====================================================

  const handleBiometricLogin = async () => {
    if (busy || biometricChecking) return;

    console.log("[LOGIN] Fingerprint login clicked");

    setBiometricLoading(true);

    try {
      const status = await refreshBiometricStatus();

      console.log("[LOGIN] Fingerprint login status:", status);

      if (!status.available) {
        toast.error(
          status.error || "Biometrics are unavailable on this device."
        );
        return;
      }

      if (!status.enabled) {
        toast.info(
          "Please sign in with your password first to enable fingerprint login."
        );

        if (authApi.getToken()) {
          setShowBiometricSetup(true);
        }
        return;
      }

      console.log("[LOGIN] Requesting native fingerprint authentication");

      const result = await loginWithBiometrics();
      dispatch(setSession(result));

      console.log("[LOGIN] Biometric backend response received");

      // Verify that the biometric service created a session.
      const token = authApi.getToken();
      const currentUser = authApi.getUser();

      if (!token || !currentUser) {
        console.error("[LOGIN] Session verification failed", {
          hasToken: !!token,
          hasUser: !!currentUser,
          hasResponse: !!result,
        });

        throw new Error(
          "Fingerprint authentication succeeded but no valid session was created."
        );
      }

      toast.success("Fingerprint login successful.");

      setShowMode(true);
    } catch (error) {
      console.error("[LOGIN] Fingerprint login failed:", error);

      if (String(error?.code) === "21") {
        const recoveryMessage =
          "Fingerprint credentials need to be registered again. Sign in with your password to re-enable fingerprint login.";
        setBiometricEnabled(false);
        setBiometricStatusMessage(recoveryMessage);
        toast.error(recoveryMessage);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  // =====================================================
// AUTOMATIC FINGERPRINT LOGIN
// =====================================================

useEffect(() => {
  if (
    biometricChecking ||
    !biometricAvailable ||
    !biometricEnabled ||
    biometricAutoPrompted.current
  ) {
    return;
  }

  // Prevent the fingerprint prompt from opening repeatedly.
  biometricAutoPrompted.current = true;

  console.log("[LOGIN] Automatically requesting fingerprint login");

  handleBiometricLogin();
}, [
  biometricChecking,
  biometricAvailable,
  biometricEnabled,
]);

  // =====================================================
  // ENABLE FINGERPRINT
  // =====================================================

  const handleEnableBiometrics = async () => {
    if (busy) return;

    console.log("[LOGIN] Starting fingerprint enrollment");

    setBiometricLoading(true);

    try {
      const token = authApi.getToken();

      console.log("[LOGIN] Session exists:", !!token);

      if (!token) {
        throw new Error("Please sign in with your password first.");
      }

      const status = await refreshBiometricStatus();

      console.log("[LOGIN] Enrollment availability:", status);

      if (!status.available) {
        throw new Error(
          status.error || "Fingerprint authentication is unavailable."
        );
      }

      if (status.enabled) {
        console.log("[LOGIN] Fingerprint already registered");

        setShowBiometricSetup(false);

        toast.success("Fingerprint login is already enabled.");
        return;
      }

      console.log("[LOGIN] Calling biometric enrollment service");

      await enableBiometricLogin();

      console.log("[LOGIN] Enrollment request completed");

      const finalStatus = await refreshBiometricStatus();

      console.log("[LOGIN] Final enrollment status:", finalStatus);

      if (!finalStatus.enabled) {
        throw new Error(
          "Fingerprint registration could not be confirmed."
        );
      }

      setAllowBiometrics(true);
      setShowBiometricSetup(false);

      toast.success("Fingerprint login enabled successfully.");
    } catch (error) {
      console.error("[LOGIN] Fingerprint enrollment failed:", error);

      toast.error(getErrorMessage(error));
    } finally {
      setBiometricLoading(false);
    }
  };

  // =====================================================
  // BIOMETRIC PREFERENCE
  // =====================================================

  const handleBiometricPreference = (allow) => {
    console.log("[LOGIN] Biometric preference:", allow);

    setAllowBiometrics(allow);

    if (allow) {
      toast.info("Fingerprint login selected. Sign in to enable it.");
    } else {
      setShowBiometricSetup(false);

      toast.info("Password login only selected.");
    }
  };

  // =====================================================
  // MOOD SELECTION
  // =====================================================

  const handleMoodSelect = async (mood) => {
    try {
      await dispatch(sendMood(mood)).unwrap();

      setShowMode(false);
      navigate("/welcome");
    } catch (error) {
      console.error("[LOGIN] Mood selection failed:", error);

      toast.error("Failed to send mood.");
    }
  };

  const handleSkip = () => {
    setShowMode(false);
    navigate("/welcome");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading && !user) {
    return <Spinner />;
  }

  // =====================================================
  // LOGIN UI
  // =====================================================

  return (
    <>
      {/* MOOD MODAL */}

      {showMode && (
        <div className="fixed inset-0 z-50">
          <Mode
            onSelectMood={handleMoodSelect}
            onSkip={handleSkip}
          />
        </div>
      )}

      {/* LOGIN PAGE */}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

          <h2 className="text-3xl font-bold text-center mb-3">
            Welcome Back
          </h2>

          <p className="text-center text-gray-600 mb-8">
            Sign in to continue
          </p>

          {/* LOGIN FORM */}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* IDENTIFIER */}

            <input
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="username"
              disabled={busy}
              required
            />

            {/* PASSWORD */}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pr-12 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete="current-password"
                disabled={busy}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={busy}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition"
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-gray-600" />
                ) : (
                  <Eye size={18} className="text-gray-600" />
                )}
              </button>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={busy}
              className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400 transition"
            >
              {submitting || isLoading
                ? "Logging in..."
                : "Login"}
            </button>

            {/* BIOMETRIC PREFERENCE */}

            {!biometricEnabled && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                <div className="flex items-center gap-3">
                  <Fingerprint
                    size={30}
                    className="shrink-0 text-blue-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Fingerprint Login
                    </p>

                    <p className="text-xs text-gray-500">
                      Would you like to enable fingerprint authentication?
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    disabled={busy || biometricChecking || !biometricAvailable}
                    onClick={() => handleBiometricPreference(true)}
                    aria-pressed={allowBiometrics === true}
                    className={`rounded-lg border py-3 text-sm font-semibold transition ${
                      allowBiometrics === true
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-green-200 bg-white text-green-700"
                    } disabled:opacity-50`}
                  >
                    ✓ Allow
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleBiometricPreference(false)}
                    aria-pressed={allowBiometrics === false}
                    className={`rounded-lg border py-3 text-sm font-semibold transition ${
                      allowBiometrics === false
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-red-200 bg-white text-red-600"
                    } disabled:opacity-50`}
                  >
                    ✕ Disallow
                  </button>
                </div>

                <p className="mt-3 text-center text-xs text-gray-500">
                  {biometricChecking
                    ? "Checking biometric availability..."
                    : allowBiometrics === true
                      ? "Fingerprint verification will follow password login."
                      : allowBiometrics === false
                        ? "You selected password login only."
                        : !biometricAvailable
                          ? biometricStatusMessage || "Fingerprint authentication is unavailable."
                          : "Select Allow or Disallow."}
                </p>
              </div>
            )}
          </form>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* FINGERPRINT LOGIN */}

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={busy || biometricChecking || !biometricAvailable}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 py-4 font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {biometricLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
            ) : (
              <Fingerprint
                size={28}
                className="transition-transform group-hover:scale-110"
              />
            )}

            <span>
              {biometricChecking
                ? "Checking fingerprint..."
                : biometricLoading
                  ? "Verifying fingerprint..."
                  : biometricEnabled
                    ? "Login with Fingerprint"
                    : "Enable / Login with Fingerprint"}
            </span>
          </button>

          <p className="mt-2 text-center text-xs text-gray-500">
            {biometricStatusMessage ||
              (biometricEnabled
                ? "Authenticate securely using your fingerprint."
                : "Sign in with your password to register fingerprint login.")}
          </p>

          {/* REGISTER */}

          <p className="mt-6 text-center text-sm text-gray-700">
            Don't have an account?{" "}

            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Create account
            </span>
          </p>
        </div>
      </div>

      {/* BIOMETRIC SETUP MODAL */}

      {showBiometricSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="biometric-title"
            className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <Fingerprint
                size={55}
                className="text-blue-500"
              />
            </div>

            <h2
              id="biometric-title"
              className="mt-5 text-2xl font-bold text-gray-900"
            >
              Enable Fingerprint Login
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Register your fingerprint to securely access your account
              without entering your password next time.
            </p>

            {/* ENABLE FINGERPRINT */}

            <button
              type="button"
              onClick={handleEnableBiometrics}
              disabled={busy || !biometricAvailable}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {biometricLoading
                ? "Registering fingerprint..."
                : "Enable Fingerprint"}
            </button>

            {/* CONTINUE WITH PASSWORD */}

            <button
              type="button"
              onClick={() => {
                setShowBiometricSetup(false);

                document
                  .querySelector('input[autocomplete="username"]')
                  ?.focus();
              }}
              disabled={biometricLoading}
              className="mt-3 w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
            >
              Continue with Password
            </button>

            {/* MAYBE LATER */}

            <button
              type="button"
              onClick={() => setShowBiometricSetup(false)}
              disabled={biometricLoading}
              className="mt-2 w-full rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Maybe Later
            </button>

          </section>
        </div>
      )}
    </>
  );
}
