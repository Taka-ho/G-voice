<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('broadcasting_rooms', function (Blueprint $table) {
            $table->id()->unique();

            // broadcasts テーブルの外部キー関連付け
            $table->unsignedBigInteger('user_id')->NotNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('room_names', 140)->NotNull();
            $table->string('room_explain', 140);
            $table->integer('broadcasting_flag')->NotNull();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
    }
};
