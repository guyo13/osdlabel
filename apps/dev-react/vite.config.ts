import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;

export default defineConfig({
  server: { port: PORT },
  plugins: [react()],
  build: { target: 'esnext' },
});
