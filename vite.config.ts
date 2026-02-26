import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    react(),
    tailwindcss(),
  ],
})

export default config
