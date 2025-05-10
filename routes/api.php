<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\BroadcastController;

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

Route::middleware(['auth:sanctum'])->group(function(){
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/comments', [CommentController::class, 'index'])->name('get.broadcastingRooms.comment');
    Route::post('/comments', [CommentController::class, 'store'])->name('store.broadcastingRooms.comment');
});

// ユーザーのソースコード(treeData, file_and_contents)をwatch-prjコンテナから受け取る。
Route::post('/insertUsersCode', [BroadcastController::class, 'insertUsersCode']);
Route::get('/roomsList', [BroadcastController::class, 'RoomsList'])->name('broadcast.RoomsList');
Route::get('/getContainerId{broadcastingRoomId}', [GetContainerService::class, 'GetContainerId'])->name('broadcast.getContainerId');
