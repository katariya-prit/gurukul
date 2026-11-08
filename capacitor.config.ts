import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gurukul.app',
  appName: 'gurukul',
  webDir: 'dist',
  server: {
    androidScheme: 'https' // 👈 આ લાઈન એન્ડ્રોઇડ પર વાઈટ સ્ક્રીન અટકાવવા માટે ફરજિયાત છે
  }
};

export default config;