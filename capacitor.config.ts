import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tinkreward.app',
  appName: 'TinkReward',
  webDir: 'dist',

  server: {
    url: 'https://face-rite.onrender.com',
    cleartext: false,
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert', 'banner', 'list'],
    },
  },
};

export default config;