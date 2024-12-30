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

            // users テーブルの外部キー関連付け
            $table->unsignedBigInteger('user_id')->NotNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('room_names', 140)->NotNull();
            $table->string('room_explain', 140)->nullable();
            $table->integer('broadcasting_flag')->NotNull();
            $table->string('container_id', 64)->nullable()->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // broadcasting_rooms の外部キー制約を解除してテーブルを削除
        if (Schema::hasTable('broadcasting_rooms')) {
            Log::debug("broadcasting_roomsが存在する");
            Schema::table('broadcasting_rooms', function (Blueprint $table) {
                $table->dropForeign(['user_id']); // 外部キーを削除
            });
    
            Schema::dropIfExists('broadcasting_rooms'); // テーブルを削除
        }
    
        // 最後に users テーブルを削除
        if (Schema::hasTable('users')) {
            Schema::dropIfExists('users');
        }
    }
    
};
