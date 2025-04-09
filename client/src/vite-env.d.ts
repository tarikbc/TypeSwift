/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly [key: string]: string | boolean | undefined;
  };
}
