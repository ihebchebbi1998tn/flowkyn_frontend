import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Vite plugin: generates public/version.json on every production build
 * with a unique timestamp so clients can detect new deployments.
 */
const versionJsonPlugin = () => ({
  name: 'version-json',
  async buildStart() {
    const fs = await import('node:fs');
    const versionPath = path.resolve(process.cwd(), 'public/version.json');
    fs.writeFileSync(versionPath, JSON.stringify({ v: String(Date.now()) }));
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && versionJsonPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
