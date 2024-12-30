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
        Schema::create('users_codes', function (Blueprint $table) {
            $table->id();
            // user_idをUsersテーブルから外部キーとして取得
            $table->unsignedBigInteger('user_id')->nullable(false);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // broadcasting_idをbroadcasting_roomsテーブルから外部キーとして取得
            $table->unsignedBigInteger('broadcasting_id')->nullable(false);
            $table->foreign('broadcasting_id')->references('id')->on('broadcasting_rooms')->onDelete('cascade');
            // container_idをstring型に修正
            $table->string('container_id')->nullable(false);
            $table->foreign('container_id')->references('container_id')->on('broadcasting_rooms')->onDelete('cascade');
            $table->text('tree_data')->nullable();
            $table->text('file_and_contents')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // users_codes テーブルの外部キー制約を解除
        if (Schema::hasTable('users_codes')) {
            Schema::table('users_codes', function (Blueprint $table) {
                $table->dropForeign(['broadcasting_id']); // 参照している外部キーを削除
                $table->dropForeign(['container_id']); // container_idの外部キーも削除
            });
        }
    
        // broadcasting_rooms テーブルを削除
        if (Schema::hasTable('broadcasting_rooms')) {
            Schema::dropIfExists('broadcasting_rooms'); // テーブルを削除
        }
    
        // 最後に users テーブルを削除
        if (Schema::hasTable('users')) {
            Schema::dropIfExists('users');
        }
    }
    
};
