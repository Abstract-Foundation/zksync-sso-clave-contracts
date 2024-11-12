import { defineNuxtConfig } from "nuxt/config";
import { zksyncInMemoryNode, zksyncSepoliaTestnet } from "viem/chains";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-07-08",
  devtools: { enabled: false },
  modules: ["@nuxt/eslint", "@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/google-fonts", "@vueuse/nuxt", "radix-vue/nuxt", "@nuxtjs/color-mode"],
  app: {
    head: {
      title: "ZKsync SSO",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },
  ssr: false,
  vite: {
    mode: "development",
    build: {
      minify: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
  // nitro: {
  //   esbuild: {
  //     options: {
  //       target: 'esnext'
  //     }
  //   }
  // },
  devServer: {
    port: 3002,
  },
  css: ["@/assets/css/tailwind.css", "@/assets/css/style.scss", "web3-avatar-vue/dist/style.css"],
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
    },
  },
  colorMode: {
    preference: "dark",
  },
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        semi: true,
        quotes: "double",
        arrowParens: true,
        quoteProps: "as-needed",
        braceStyle: "1tbs",
      },
    },
  },
  runtimeConfig: {
    public: {
      chain: zksyncSepoliaTestnet,
      paymaster: "0xA18f9a11565eFAF0bf0DDe37B8960eACDb8AA538",
    },
  },
  $production: {
    runtimeConfig: {
      public: {
        chain: zksyncSepoliaTestnet,
        paymaster: "0xA18f9a11565eFAF0bf0DDe37B8960eACDb8AA538",
      },
    },
  },
});
