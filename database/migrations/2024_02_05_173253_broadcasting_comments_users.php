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
        Schema::create('broadcasting_comments_users', function (Blueprint $table) {
            $table->id()->unique();

            // broadcasting_rooms_comments テーブルの外部キー関連付け
            $table->unsignedBigInteger('broadcasting_comment_id')->NotNull();
            $table->foreign('broadcasting_comment_id')->references('id')->on('broadcasting_rooms_comments')->onDelete('cascade');

            // broadcasting_rooms_users テーブルの外部キー関連付け
            $table->unsignedBigInteger('broadcasting_user_id')->NotNull();
            $table->foreign('broadcasting_user_id')->references('id')->on('broadcasting_rooms_users')->onDelete('cascade');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasting_comments_users');
    }
};
