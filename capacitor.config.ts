import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teel.GifGallery',
  appName: 'Gif Gallery',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
