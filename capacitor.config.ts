import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teelirium.GifGallery',
  appName: 'Gif Gallery',
  webDir: './out/renderer',
  server: {
    androidScheme: 'https',
  },
};

export default config;
