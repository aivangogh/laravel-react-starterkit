<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Allows the decoupled Vue SPA (FRONTEND_URL) to call the API and Fortify
    | auth endpoints with credentials (cookies). `supports_credentials` MUST be
    | true for Sanctum SPA cookie authentication to work.
    |
    | `allowed_origins` is derived from FRONTEND_URL, which accepts a
    | comma-separated list so several origins (e.g. dev + prod) are allowed:
    |   FRONTEND_URL=http://localhost:5174,https://app.example.com
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
        'forgot-password',
        'reset-password',
        'user/*',
        'two-factor-challenge',
        'email/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5174')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
