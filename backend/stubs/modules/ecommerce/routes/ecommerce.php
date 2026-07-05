<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| E-commerce module routes
|--------------------------------------------------------------------------
|
| Published by `kit:install` into routes/modules/ecommerce.php and auto-loaded
| by routes/api.php. Paths are relative to the `/api` prefix. The whole module
| sits behind `auth:sanctum`; catalog + order back-office actions are further
| gated by `catalog.*` / `orders.*` permissions in their controllers, while the
| cart and checkout are self-service against the acting user.
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Catalog CRUD. Per-action gates (catalog.view|create|update|delete) are
    // declared in the controllers via HasMiddleware.
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);

    // The authenticated user's own cart. Self-service: no extra permission
    // beyond `auth:sanctum`. Line mutations are ownership-checked.
    Route::get('cart', [CartController::class, 'show']);
    Route::post('cart/items', [CartController::class, 'addItem']);
    Route::put('cart/items/{cartItem}', [CartController::class, 'updateItem']);
    Route::delete('cart/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('cart', [CartController::class, 'clear']);

    // Orders. index/show/update/destroy are back-office (orders.* gates in the
    // controller); store is a self-service checkout from the user's cart.
    Route::apiResource('orders', OrderController::class);
});
