<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA: authenticate first-party requests from the stateful
        // domains (SANCTUM_STATEFUL_DOMAINS) via the session cookie.
        $middleware->statefulApi();

        // Behind Cloudflare (or any TLS-terminating proxy) the app only sees
        // plain HTTP; trusting the proxy's X-Forwarded-* headers keeps URL
        // generation and secure-cookie detection on https.
        $middleware->trustProxies(at: env('TRUSTED_PROXIES'));

        // Spatie Permission route middleware aliases.
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render every /api/* failure as JSON in the shared `ApiError` shape
        // ({ message, errors? }), regardless of the client's Accept header.
        // Laravel's default JSON renderer already maps the framework
        // exceptions onto this shape: ValidationException -> 422
        // { message, errors }, AuthenticationException -> 401 { message },
        // Spatie's UnauthorizedException (a 403 HttpException) -> { message },
        // and (Model)NotFound -> 404 { message }.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
