import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "react-toastify";

let activeAuthToken: string | null = null;

export async function initializePushNotifications(
  authToken: string,
  apiBase: string
): Promise<void> {
  try {
    if (!authToken) return;

    // Prevent duplicate initialization for same user
    if (activeAuthToken === authToken) {
      return;
    }

    activeAuthToken = authToken;

    // Only run on native Android/iOS
    if (!Capacitor.isNativePlatform()) {
      console.log("Push notifications skipped: not a native platform");
      return;
    }

    if (!Capacitor.isPluginAvailable("PushNotifications")) {
      console.log("PushNotifications plugin unavailable");
      return;
    }

    const permission = await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      console.warn("Push notification permission denied");
      return;
    }

    // Remove old listeners before re-registering
    await PushNotifications.removeAllListeners();

    /* ---------------- Registration Success ---------------- */

    PushNotifications.addListener("registration", async ({ value }) => {
      try {
        console.log("FCM Token:", value);

        await fetch(`${apiBase}/api/notifications/fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            fcmToken: value,
          }),
        });

        console.log("FCM token saved successfully");
      } catch (error) {
        console.error("Failed to save FCM token:", error);
      }
    });

    /* ---------------- Registration Error ---------------- */

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    /* ---------------- Foreground Notification ---------------- */

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Notification received:", notification);

        const message =
          notification.body ||
          notification.title ||
          "New notification";

        toast.info(`🔔 ${message}`);
      }
    );

    /* ---------------- Notification Click ---------------- */

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      ({ notification }) => {
        const data = notification?.data;

        if (data?.postId) {
          window.location.href = `/post/${data.postId}`;
          return;
        }

        if (data?.chatUserId) {
          window.location.href = `/chat/${data.chatUserId}`;
          return;
        }

        if (data?.groupId) {
          window.location.href = `/group/${data.groupId}`;
        }
      }
    );

    await PushNotifications.register();

    console.log("Push notifications initialized");
  } catch (error) {
    console.error("Push notification initialization failed:", error);
  }
}

/**
 * Call this on logout
 */
export async function resetPushNotifications(): Promise<void> {
  try {
    activeAuthToken = null;
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error("Failed to reset push notifications:", error);
  }
}