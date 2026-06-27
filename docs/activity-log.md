# Activity Log (Spatie Activitylog v5)

## Installed state

- `spatie/laravel-activitylog` **5.0.0** is installed.
- `config/activitylog.php` is published.
- The `activity_log` table exists.

## How it's wired

### 1. Auditable models

The `User` model is already audited (Phase 1). Add the same trait + log-options method to any other
model you want audited (e.g. `Role`, and later the e-commerce models).

> **v5 API note (changed from v4):** the trait moved to
> `Spatie\Activitylog\Models\Concerns\LogsActivity`, `LogOptions` lives at
> `Spatie\Activitylog\Support\LogOptions`, and the method is `dontLogEmptyChanges()` (was
> `dontSubmitEmptyLogs()` in v4).

```php
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class User extends Authenticatable
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
```

This automatically records `created` / `updated` / `deleted` events. (Verified in Phase 1:
registering a user writes one `created` row to `activity_log`.)

### 2. Log custom events (optional)

```php
activity()
    ->causedBy($actor)
    ->performedOn($subject)
    ->withProperties(['ip' => request()->ip()])
    ->log('assigned role admin');
```

### 3. Expose a read-only API

A planned `ActivityLogController@index` returns paginated entries (with causer + subject) for an
admin "Activity Log" screen, gated by the `activity-log.view` permission ([rbac.md](rbac.md)).

```php
use Spatie\Activitylog\Models\Activity;

Activity::with(['causer', 'subject'])->latest()->paginate(20);
```

## Retention

Prune old entries with the built-in command (schedule it as needed):

```bash
php artisan activitylog:clean
```

Configure the retention window via `activitylog.delete_records_older_than_days` in
`config/activitylog.php`.

## Reference

- Docs: https://spatie.be/docs/laravel-activitylog/v5
