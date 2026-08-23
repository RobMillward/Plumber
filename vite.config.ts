import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5174, // Use a different port
  },
})
