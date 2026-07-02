# E-commerce module (stub)

Self-contained backend half of the optional **E-commerce** preset. These files
are **not autoloaded or migrated in a Basic install** — `php artisan kit:install`
copies them into `backend/app`, `backend/database`, and `backend/routes/modules`
when the E-commerce preset is selected. See [`docs/modules.md`](../../../../docs/modules.md).

Layout mirrors where each file lands once published, so no namespace rewriting
is needed on install:

```
app/Models/            Category, Product (+ more in later sub-issues)
database/migrations/   catalog + cart/order tables
database/factories/    model factories
routes/modules/        ecommerce.php (added with the controllers)
```

## How this is tested without publishing

- `composer.json` maps `stubs/modules` into the **`autoload-dev` classmap**, so
  the module classes load in dev/test only (excluded from `composer install
  --no-dev`, keeping a real Basic install free of e-commerce code).
- `AppServiceProvider` registers every `stubs/modules/*/database/migrations` path
  **only in the `testing` environment**, so the suite migrates and exercises the
  module as if it were installed.
