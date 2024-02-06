<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CommentController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 既存のコメント取得エンドポイント
Route::get('/comments', [CommentController::class, 'index'])->name('get.broadcastingRooms.comment');

// 新しいコメント作成エンドポイント
Route::post('/comments', [CommentController::class, 'store'])->name('store.broadcastingRooms.comment');

