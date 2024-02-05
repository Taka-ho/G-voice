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
        //Broadcastにいる配信者と視聴者を区別するためのテーブル
        Schema::create('broadcasting_rooms_users', function (Blueprint $table) {
            $table->id()->unique();

            // users テーブルの外部キー関連付け
            $table->unsignedBigInteger('user_id')->NotNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->unsignedBigInteger('broadcast_id')->NotNull(); // <-- 修正: 'broadcasts_id' を 'broadcast_id' に変更
            $table->foreign('broadcast_id')->references('id')->on('broadcasting_rooms')->onDelete('cascade');

            $table->tinyInteger('streamer_flag')->default(0)->NotNull();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('broadcasting_rooms_users');
    }
};
