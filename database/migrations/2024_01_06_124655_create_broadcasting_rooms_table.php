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
    
            $table->unsignedBigInteger('user_id')->notNull();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('room_names', 140)->notNull();
            $table->string('container_id', 64)->notNull()->unique();
            $table->string('room_explain', 140)->nullable();
            $table->integer('broadcasting_flag')->notNull();
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
