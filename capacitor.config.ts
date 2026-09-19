import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.beserious.nutrition',
  appName: 'Serious Nutrition',
  webDir: 'dist',
  // WebView-Inhalt darf unter die Statusleiste laufen; Safe-Area regelt das CSS.
  ios: {
    contentInset: 'never',
    scheme: 'Serious Nutrition',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0f1115',
    },
    StatusBar: {
      style: 'DEFAULT',
      overlaysWebView: true,
    },
  },
};

export default config;
