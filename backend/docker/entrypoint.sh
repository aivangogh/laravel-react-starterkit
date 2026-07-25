#!/bin/sh
set -e

# Cache config/routes against the runtime env, then bring the schema up.
# Running migrate at boot is demo-grade: fine for a single instance, replace
# with a deploy step before scaling out.
php artisan config:cache
php artisan route:cache
php artisan migrate --force

# Demo-grade queue worker in the same container; restarts with the container.
php artisan queue:work --tries=3 --sleep=3 &

exec frankenphp run --config /etc/frankenphp/Caddyfile
