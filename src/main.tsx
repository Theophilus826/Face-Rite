import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

import App from "./App.tsx";
import { store } from "./app/store";

const initializeAdMob = async () => {

  // Only initialize on Android/iOS
  if (Capacitor.isNativePlatform()) {

    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: true,
    });

    console.log("AdMob initialized");
  }
};

initializeAdMob();

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);