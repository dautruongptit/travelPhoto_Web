/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string

  readonly VITE_OAUTH2_LOGIN_PATH: string

  readonly VITE_PAYMENT_MODE: "mock" | "real"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
