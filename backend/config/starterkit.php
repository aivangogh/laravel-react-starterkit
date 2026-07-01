<?php

/*
|--------------------------------------------------------------------------
| Starter kit install state
|--------------------------------------------------------------------------
|
| Records what `php artisan kit:install` provisioned. The seeders read this to
| seed only the roles/permissions for enabled features, and the SPA reads it to
| gate navigation. Ships with the Basic preset and every feature enabled so a
| fresh clone works without running the installer; `kit:install` rewrites this
| file from your answers.
|
*/

return [
    // 'basic' | 'ecommerce'
    'preset' => 'basic',

    'features' => [
        'activity_log' => true,
        'media' => true,
        'api_tokens' => true,
        'settings' => true,
    ],
];
