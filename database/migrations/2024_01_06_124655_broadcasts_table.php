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
            $table->id('broadcast_id')->unique();

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users')->OnDelete('cascade');

            $table->string('room_names');
            $table->text('room_explain');
            $table->string('source_code_of_users');
            $table->integer('broadcasting_flag');
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
