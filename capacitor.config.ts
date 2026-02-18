import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tedycelluler.app",
  appName: "Tedy Celluler",
  webDir: "out",
  server: {
    androidScheme: "https",
    url: "http://192.168.1.3:3000",
    cleartext: true,
  },
};

export default config;
