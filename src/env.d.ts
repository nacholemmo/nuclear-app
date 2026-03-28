interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  /**
   * Built-in variables provided by @ngx-env/builder
   */
  readonly NG_APP_ENV: string;
  readonly NODE_ENV: string;

  /**
   * App-specific variables (prefix NG_APP_)
   */
  readonly NG_APP_API_URL: string;
}
