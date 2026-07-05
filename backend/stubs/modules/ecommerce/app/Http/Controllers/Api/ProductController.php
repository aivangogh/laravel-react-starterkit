<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Catalog products: CRUD gated by the `catalog.*` permissions. Part of the
 * stubbed e-commerce module. The category (and Spatie media) are eager-loaded
 * to keep the listing free of N+1 queries. Sits behind `auth:sanctum`.
 */
class ProductController extends ApiController implements HasMiddleware
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
     * Paginated list of products — the shared `Paginated<Product>` shape.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        return ProductResource::collection(
            Product::query()->with(['category', 'media'])->latest('id')->paginate($perPage)
        );
    }

    /**
     * Create a product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product->load(['category', 'media'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * A single product with its category (and media).
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'media']));
    }

    /**
     * Update a product. Only supplied fields change.
     */
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->load(['category', 'media']));
    }

    /**
     * Delete a product.
     */
    public function destroy(Product $product): Response
    {
        $product->delete();

        return $this->noContent();
    }
}
