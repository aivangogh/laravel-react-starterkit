<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => Str::title(fake()->unique()->words(3, true)),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'price' => fake()->numberBetween(100, 500000),
            'stock' => fake()->numberBetween(0, 1000),
            'is_active' => true,
        ];
    }

    /**
     * Attach a fake image to the product's `images` media collection. The
     * caller is responsible for faking the storage disk (Storage::fake).
     */
    public function withImage(): static
    {
        return $this->afterCreating(function (Product $product): void {
            $product->addMedia(UploadedFile::fake()->image('product.jpg'))
                ->toMediaCollection('images');
        });
    }
}
