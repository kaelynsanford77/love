import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lovablesolo.app",
  appName: "Lovable Solo",
  webDir: "dist",
  server: {
    androidScheme: "https",
    // Use live reload URL in development — set via VITE_ORCHESTRATOR_URL
    // url: "http://192.168.x.x:3000", // Uncomment and set your local IP for live reload
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#7c3aed",
      showSpinner: false,
    },
    StatusBar: {
      style: "Light",
      backgroundColor: "#7c3aed",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    backgroundColor: "#ffffff",
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: "#ffffff",
    allowMixedContent: true,
  },
};

export default config;
