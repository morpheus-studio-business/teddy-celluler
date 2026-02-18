import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tedycelluler.app",
  appName: "Tedy Celluler",
  webDir: "out",
  server: {
    androidScheme: "https",
    url: "https://celluler.morpheus-studio.pro",
    cleartext: true,
  },
};

export default config;
