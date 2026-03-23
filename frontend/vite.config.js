import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 外部からのアクセスを許可するホスト名を追加
    allowedHosts: ["docker-ec2-ohara.duckdns.org"],
  },
});
