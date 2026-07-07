<?php

namespace Tests\Feature\Installer;

use App\Installer\ModulePublisher;
use Illuminate\Filesystem\Filesystem;
use Tests\TestCase;

/**
 * Exercises the move semantics against a throwaway fixture tree so the real e-commerce stub is never
 * touched. Verifies the stub is merged into the app, consumed, and that publishing is idempotent.
 */
class ModulePublisherTest extends TestCase
{
    private Filesystem $files;

    private string $base;

    private string $backend;

    private string $web;

    protected function setUp(): void
    {
        parent::setUp();

        $this->files = new Filesystem;
        $this->base = sys_get_temp_dir().'/modpub_'.uniqid();
        $this->backend = $this->base.'/backend';
        $this->web = $this->base.'/web';

        // An existing app file to prove the move MERGES rather than replaces the app/ tree.
        $this->writeFixture($this->backend.'/app/Models/User.php', '<?php // existing');

        // A module stub laid out like backend/stubs/modules/<m> + apps/web/stubs/modules/<m>.
        $this->writeFixture($this->backend.'/stubs/modules/shop/app/Models/Product.php', '<?php // product');
        $this->writeFixture($this->backend.'/stubs/modules/shop/app/Http/Controllers/Api/ProductController.php', '<?php // controller');
        $this->writeFixture($this->backend.'/stubs/modules/shop/database/migrations/2026_01_01_create_products.php', '<?php // migration');
        $this->writeFixture($this->backend.'/stubs/modules/shop/database/factories/ProductFactory.php', '<?php // factory');
        $this->writeFixture($this->backend.'/stubs/modules/shop/routes/shop.php', '<?php // routes');
        $this->writeFixture($this->backend.'/stubs/modules/shop/README.md', '# shop');
        $this->writeFixture($this->web.'/stubs/modules/shop/routes.ts', '// routes');
        $this->writeFixture($this->web.'/stubs/modules/shop/pages/Index.vue', '<template />');
    }

    protected function tearDown(): void
    {
        $this->files->deleteDirectory($this->base);

        parent::tearDown();
    }

    public function test_it_moves_the_stub_into_the_app_tree(): void
    {
        $this->assertFalse($this->publisher()->isPublished('shop'));

        $this->assertTrue($this->publisher()->publish('shop'));

        // Backend files landed in their real homes.
        $this->assertFileExists($this->backend.'/app/Models/Product.php');
        $this->assertFileExists($this->backend.'/app/Http/Controllers/Api/ProductController.php');
        $this->assertFileExists($this->backend.'/database/migrations/2026_01_01_create_products.php');
        $this->assertFileExists($this->backend.'/database/factories/ProductFactory.php');
        $this->assertFileExists($this->backend.'/routes/modules/shop.php');

        // Frontend feature landed under src/features/<m>.
        $this->assertFileExists($this->web.'/src/features/shop/routes.ts');
        $this->assertFileExists($this->web.'/src/features/shop/pages/Index.vue');

        // The merge preserved the pre-existing app file.
        $this->assertFileExists($this->backend.'/app/Models/User.php');

        // The stub is consumed on both sides.
        $this->assertDirectoryDoesNotExist($this->backend.'/stubs/modules/shop');
        $this->assertDirectoryDoesNotExist($this->web.'/stubs/modules/shop');

        $this->assertTrue($this->publisher()->isPublished('shop'));
    }

    public function test_publishing_is_idempotent(): void
    {
        $this->assertTrue($this->publisher()->publish('shop'));
        $this->assertFalse($this->publisher()->publish('shop'));
    }

    private function publisher(): ModulePublisher
    {
        return new ModulePublisher($this->files, $this->backend, $this->web);
    }

    private function writeFixture(string $path, string $contents): void
    {
        $this->files->ensureDirectoryExists(dirname($path));
        $this->files->put($path, $contents);
    }
}
