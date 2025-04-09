import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "4c5f-2603-8080-1a00-1d7b-b076-bf26-5815-5aa.ngrok-free.app",
    ],
  },
});
