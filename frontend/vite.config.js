import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- AÑADIR ESTE PLUGIN ---
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola
      
      // Configuración del manifiesto de la PWA
      manifest: {
        name: 'EnergiSense App',
        short_name: 'EnergiSense',
        description: 'Dashboard de monitoreo de energía industrial.',
        theme_color: '#111827', // Color de la barra de título (bg-gray-900)
        background_color: '#1F2937', // Color de fondo al cargar (bg-gray-800)
        start_url: '/',
        display: 'standalone', // Se abre como app, sin barras de navegador
        icons: [
          {
            src: 'pwa-192x192.png', // Icono para Android
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Icono para Windows
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
