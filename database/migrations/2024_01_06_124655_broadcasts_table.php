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
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id()->unique();

            // broadcasts テーブルの外部キー関連付け
            $table->unsignedBigInteger('user_id')->NotNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('room_names')->NotNull();
            $table->text('room_explain');
            $table->integer('broadcasting_flag')->NotNull();
            $table->date('created_at');
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
