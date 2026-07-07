<?php

namespace App\Installer;

use Illuminate\Filesystem\Filesystem;

/**
 * Publishes an optional module's stub into the app by MOVING it into the real source tree — the stub
 * becomes your code. Moving (not copying) is deliberate: the backend classes live under the `App\`
 * namespace and are only reachable in the unpublished state via the `autoload-dev` classmap over
 * `stubs/modules` (plus testing-env migration/route globs). Copying would leave the class defined
 * twice (classmap + PSR-4) and run each migration twice; moving leaves exactly one home for each
 * file, after which those testing-only hooks simply find nothing for the module.
 *
 * Layout moved for module `<m>`:
 *   backend/stubs/modules/<m>/app/**            -> backend/app/**            (merge)
 *   backend/stubs/modules/<m>/database/**       -> backend/database/**       (merge: migrations + factories)
 *   backend/stubs/modules/<m>/routes/<m>.php    -> backend/routes/modules/<m>.php
 *   apps/web/stubs/modules/<m>/**               -> apps/web/src/features/<m>/**
 *
 * The caller must run `composer dump-autoload` afterwards so the classmap drops the moved-away stub
 * paths and PSR-4 picks the classes up from `app/`.
 */
class ModulePublisher
{
    public function __construct(
        private readonly Filesystem $files,
        private readonly string $backendPath,
        private readonly string $webPath,
    ) {}

    /** Wire up against the real repo layout: `backend/` and its sibling `apps/web/`. */
    public static function make(): self
    {
        return new self(new Filesystem, base_path(), base_path('../apps/web'));
    }

    /** The published route file doubles as the "already installed" sentinel. */
    public function isPublished(string $module): bool
    {
        return $this->files->exists($this->backendPath."/routes/modules/{$module}.php");
    }

    /**
     * Move the module's stub into place. Idempotent: a no-op (returns false) when already published.
     */
    public function publish(string $module): bool
    {
        if ($this->isPublished($module)) {
            return false;
        }

        $backendStub = $this->backendPath."/stubs/modules/{$module}";
        $webStub = $this->webPath."/stubs/modules/{$module}";

        // Backend: merge the app/ and database/ trees into the real ones, then relocate the routes.
        $this->moveTree($backendStub.'/app', $this->backendPath.'/app');
        $this->moveTree($backendStub.'/database', $this->backendPath.'/database');
        $this->moveFile($backendStub."/routes/{$module}.php", $this->backendPath."/routes/modules/{$module}.php");
        $this->files->deleteDirectory($backendStub); // drop the leftover README + emptied dirs

        // Frontend: the stub is location-independent (relative imports), so it drops straight into
        // features/, where the router's `import.meta.glob('@/features/*/routes.ts')` mounts it.
        $this->moveTree($webStub, $this->webPath."/src/features/{$module}");

        return true;
    }

    /** Move every file under $src into $dest, preserving sub-paths and merging into existing dirs. */
    private function moveTree(string $src, string $dest): void
    {
        if (! $this->files->isDirectory($src)) {
            return;
        }

        foreach ($this->files->allFiles($src) as $file) {
            $this->moveFile($file->getPathname(), $dest.'/'.$file->getRelativePathname());
        }

        $this->files->deleteDirectory($src);
    }

    /** Move a single file, creating the destination directory and replacing any stale target. */
    private function moveFile(string $from, string $to): void
    {
        if (! $this->files->exists($from)) {
            return;
        }

        $this->files->ensureDirectoryExists(dirname($to));

        if ($this->files->exists($to)) {
            $this->files->delete($to);
        }

        $this->files->move($from, $to);
    }
}
