import { useEffect, useState } from "react";

export default function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();

      // store the event for later use
      window.deferredPrompt = e;

      // tell UI install is available
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    const promptEvent = window.deferredPrompt;

    if (!promptEvent) return;

    promptEvent.prompt();

    const choice = await promptEvent.userChoice;

    if (choice && choice.outcome === "accepted") {
      console.log("App installed");
    }

    window.deferredPrompt = null;
    setIsInstallable(false);
  };

  return {
    isInstallable,
    installApp,
  };
}