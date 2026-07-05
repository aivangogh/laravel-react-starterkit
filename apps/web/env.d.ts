/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Laravel API host (root — Fortify routes live at `/`, API at `/api`). */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
