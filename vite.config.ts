import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // --- ADICIONADO: Configuração do Proxy ---
    // Isto resolve o problema de CORS durante o desenvolvimento local.
    proxy: {
      // Qualquer requisição para /api será redirecionada para a API da SPTrans
      '/api': {
        target: 'http://api.olhovivo.sptrans.com.br/v2.1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api do início da URL
      },
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
