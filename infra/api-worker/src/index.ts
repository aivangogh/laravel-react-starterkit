import { Container } from '@cloudflare/containers';

interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  APP_KEY: string;
  DB_URL: string;
  REDIS_URL: string;
  [key: string]: unknown;
}

/**
 * Runs the Laravel image from backend/Dockerfile. All Worker vars/secrets
 * that Laravel reads are forwarded as container environment variables.
 */
export class ApiContainer extends Container<Env> {
  defaultPort = 8080;

  // Demo/staging: let the container sleep when idle; cold start re-runs
  // config:cache + migrate (see backend/docker/entrypoint.sh).
  sleepAfter = '30m';

  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    const forwarded = [
      'APP_ENV',
      'APP_DEBUG',
      'APP_KEY',
      'APP_URL',
      'FRONTEND_URL',
      'SESSION_DOMAIN',
      'SESSION_SECURE_COOKIE',
      'SESSION_DRIVER',
      'CACHE_STORE',
      'QUEUE_CONNECTION',
      'DB_CONNECTION',
      'DB_URL',
      'REDIS_CLIENT',
      'REDIS_URL',
      'TRUSTED_PROXIES',
      'LOG_CHANNEL',
    ];

    this.envVars = Object.fromEntries(
      forwarded
        .filter((key) => typeof env[key] === 'string')
        .map((key) => [key, env[key] as string]),
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Single named instance — a demo-grade stand-in for a real service.
    const container = env.API_CONTAINER.getByName('api');
    return container.fetch(request);
  },
};
