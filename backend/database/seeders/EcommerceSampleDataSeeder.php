<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Seeds a small, realistic demo dataset for the E-commerce preset: a few
 * categories, several products across them, and one demo customer with a cart
 * and a placed order whose line items snapshot price/name at checkout.
 *
 * Preset-gated — a no-op for any preset other than `ecommerce`, so a Basic
 * install carries zero e-commerce data. Idempotent: stable rows are keyed by
 * slug/email via firstOrCreate and the sample order is created only when the
 * demo customer has none, so a repeat `db:seed` never duplicates data.
 *
 * References the e-commerce module models, which exist only for this preset —
 * published by `kit:install` in a real install, autoloaded via the dev classmap
 * in tests. The preset guard means they are never touched otherwise.
 */
class EcommerceSampleDataSeeder extends Seeder
{
    /**
     * Demo catalogue: category name => list of [product name, price (minor
     * units / cents), stock].
     *
     * @var array<string, list<array{0: string, 1: int, 2: int}>>
     */
    private const CATALOGUE = [
        'Apparel' => [
            ['Classic Cotton T-Shirt', 1999, 120],
            ['Merino Wool Sweater', 8900, 40],
            ['Denim Trucker Jacket', 12900, 25],
        ],
        'Electronics' => [
            ['Wireless Earbuds', 7900, 80],
            ['Mechanical Keyboard', 11900, 35],
            ['USB-C Fast Charger', 2500, 200],
        ],
        'Home & Kitchen' => [
            ['Ceramic Coffee Mug', 1500, 300],
            ['Cast Iron Skillet', 4500, 60],
            ['Stainless French Press', 3200, 90],
        ],
    ];

    public function run(): void
    {
        // Preset-gated: the demo dataset exists only for the E-commerce preset.
        // A Basic install (or a direct call under any other preset) is a no-op.
        if (config('starterkit.preset') !== 'ecommerce') {
            return;
        }

        $products = $this->seedCatalogue();
        $this->seedSampleCartAndOrder($products);
    }

    /**
     * Create the demo categories and their products, keyed by slug via
     * firstOrCreate so re-running never duplicates a row.
     *
     * @return Collection<int, Product>
     */
    private function seedCatalogue(): Collection
    {
        $products = collect();

        foreach (self::CATALOGUE as $categoryName => $items) {
            $category = Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName, 'description' => "Demo {$categoryName} products."],
            );

            foreach ($items as [$name, $price, $stock]) {
                $products->push(Product::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    [
                        'category_id' => $category->id,
                        'name' => $name,
                        'description' => "A demo {$name} in the {$categoryName} category.",
                        'price' => $price,
                        'stock' => $stock,
                        'is_active' => true,
                    ],
                ));
            }
        }

        return $products;
    }

    /**
     * Give a demo customer a cart with a couple of items and one placed order
     * whose line items snapshot the product name + unit price at "checkout".
     * The order is created only when the customer has none, so re-running is a
     * no-op.
     *
     * @param  Collection<int, Product>  $products
     */
    private function seedSampleCartAndOrder(Collection $products): void
    {
        $customer = User::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Demo Customer',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        $picked = $products->take(2);

        // Live cart — prices are read from the product, so only quantity is
        // stored. Unique per (cart, product), so firstOrCreate is idempotent.
        $cart = Cart::firstOrCreate(['user_id' => $customer->id]);
        foreach ($picked as $product) {
            CartItem::firstOrCreate(
                ['cart_id' => $cart->id, 'product_id' => $product->id],
                ['quantity' => 1],
            );
        }

        // One placed order. Guarded so a repeat seed does not stack duplicate
        // orders on the demo customer.
        if (Order::where('user_id', $customer->id)->exists()) {
            return;
        }

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => 'paid',
            'total' => 0,
        ]);

        $total = 0;
        foreach ($picked as $product) {
            $quantity = 1;

            // Snapshot name + unit price so the order survives later product
            // edits/deletes (see OrderItem).
            $order->items()->create([
                'product_id' => $product->id,
                'name' => $product->name,
                'unit_price' => $product->price,
                'quantity' => $quantity,
            ]);

            $total += $product->price * $quantity;
        }

        $order->update(['total' => $total]);
    }
}
