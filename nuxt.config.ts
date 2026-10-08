export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  
  devServer: {
    host: '[IP_ADDRESS]',
    port: 5002,
  },

  app: {
    head: {
      title: 'Capital Flow — Finanzas Personales',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: { lang: 'es' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
        },
      ],
    },
  },

  colorMode: { preference: 'dark' },

  routeRules: {
    '/': { redirect: '/dashboard' },
  },


  runtimeConfig: {
    public: {
      apiUrl: '',
    },
  },

  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],

})


