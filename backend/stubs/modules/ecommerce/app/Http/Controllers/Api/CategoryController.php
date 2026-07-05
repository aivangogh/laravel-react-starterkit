<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Catalog categories: CRUD gated by the `catalog.*` permissions. Part of the
 * stubbed e-commerce module — published by `kit:install` for the E-commerce
 * preset. The whole resource sits behind `auth:sanctum` (the route group).
 */
class CategoryController extends ApiController implements HasMiddleware
{
    /**
     * Per-action permission gates via the Spatie middleware alias.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:catalog.view', only: ['index', 'show']),
            new Middleware('permission:catalog.create', only: ['store']),
            new Middleware('permission:catalog.update', only: ['update']),
            new Middleware('permission:catalog.delete', only: ['destroy']),
        ];
    }

    /**
     * Paginated list of categories — the shared `Paginated<Category>` shape.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        return CategoryResource::collection(
            Category::query()->latest('id')->paginate($perPage)
        );
    }

    /**
     * Create a category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * A single category.
     */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category);
    }

    /**
     * Update a category. Only supplied fields change.
     */
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    /**
     * Delete a category (cascades to its products).
     */
    public function destroy(Category $category): Response
    {
        $category->delete();

        return $this->noContent();
    }
}
