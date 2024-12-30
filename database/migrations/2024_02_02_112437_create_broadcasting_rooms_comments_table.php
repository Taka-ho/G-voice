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
        Schema::create('broadcasting_room_comments', function (Blueprint $table) {
            $table->id()->unique();

            // users テーブルの外部キー関連付け
            $table->unsignedBigInteger('user_id')->notNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('comment', 140)->notNull();
            // broadcasting_rooms テーブルの外部キー関連付け
            $table->unsignedBigInteger('broadcasting_room_id')->notNull();
            $table->foreign('broadcasting_room_id')->references('id')->on('broadcasting_rooms')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // broadcasting_rooms の外部キー制約を解除してテーブルを削除
        if (Schema::hasTable('broadcasting_room_comments')) {
            Schema::table('broadcasting_room_comments', function (Blueprint $table) {
                $table->dropForeign(['user_id']); // 外部キーを削除
            });
            Schema::dropIfExists('broadcasting_room_comments'); // テーブルを削除
        }
    }

};
