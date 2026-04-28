import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.lovable.solo',
  appName: 'Lovable Solo',
  webDir: 'dist',
  server: {
    // For remote server usage — set to your deployed URL
    // url: 'https://ide.yourdomain.com',
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
