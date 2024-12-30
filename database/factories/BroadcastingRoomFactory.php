<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class BroadcastingRoomFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'room_names' => fake()->unique()->name(),
            'user_id' => function() {
                return User::factory()->create()->id;
            },
            'room_explain' => fake()->realText(140),
            'broadcasting_flag' => fake()->randomElement([0, 1]),
        ];
    }
}
