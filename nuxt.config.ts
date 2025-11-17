import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase'
  ],
  supabase: {
    redirectOptions: {
      login: '/josetsu',
      callback: '/josetsu',
      exclude: ['/', '/josetsu', '/notifications', '/create', '/snowlist', '/cache-test']
    }
  },
  ssr: false,
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  components: ["@/components"],
  imports: {
    dirs: [
      'composables',                              // トップレベル
      'composables/*/index.{ts,js,mjs,mts}',     // サブディレクトリのindex.ts
      'composables/**'                            // すべてのネストファイル
    ]
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 1000
      }
    },
    optimizeDeps: {
      include: ['leaflet'],
      exclude: []
    },
    ssr: {
      noExternal: ['leaflet']
    }
  },
  // Supabase configuration is handled by the @nuxtjs/supabase module
  runtimeConfig: {
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY
    }
  }
})