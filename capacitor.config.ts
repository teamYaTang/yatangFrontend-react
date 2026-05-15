import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaya.yatang',
  appName: '집밥부자',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
