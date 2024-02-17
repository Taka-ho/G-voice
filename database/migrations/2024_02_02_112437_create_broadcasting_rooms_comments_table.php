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
        Schema::create('broadcasting_rooms_comments', function (Blueprint $table) {
            $table->id()->unique();
            $table->unsignedBigInteger('broadcasting_rooms_id')->NotNull();
            $table->foreign('broadcasting_rooms_id')->references('id')->on('broadcasting_rooms')->onDelete('cascade');
            $table->string('comment');
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasting_rooms_comments');
    }
};
