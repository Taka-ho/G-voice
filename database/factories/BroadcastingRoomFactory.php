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
            'user_id' => \App\Models\User::factory(), // ユーザーを自動的に生成
            'room_names' => $this->faker->sentence(3),
            'container_id' => Str::uuid(), // UUIDを生成
            'room_explain' => $this->faker->text(140),
            'broadcasting_flag' => $this->faker->randomElement([0, 1]), // 0または1をランダムに設定
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
