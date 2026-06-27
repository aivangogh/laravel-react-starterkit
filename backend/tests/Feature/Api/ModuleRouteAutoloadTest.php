<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ModuleRouteAutoloadTest extends TestCase
{
    private string $probe;

    protected function setUp(): void
    {
        // Drop a module route file BEFORE the application boots, so the
        // autoloader in routes/api.php (glob of routes/modules/*.php) requires
        // it during route registration.
        $this->probe = __DIR__.'/../../../routes/modules/_autoload_probe.php';

        // Paths are relative to the `/api` prefix that Laravel applies to
        // everything loaded from routes/api.php — so this registers at
        // /api/_module-autoload-probe.
        file_put_contents(
            $this->probe,
            "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\n"
            ."Route::get('/_module-autoload-probe', fn () => response()->json(['ok' => true]));\n"
        );

        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        if (is_file($this->probe)) {
            unlink($this->probe);
        }
    }

    public function test_files_in_routes_modules_are_autoloaded(): void
    {
        $this->getJson('/api/_module-autoload-probe')
            ->assertOk()
            ->assertExactJson(['ok' => true]);
    }
}
