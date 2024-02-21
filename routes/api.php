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

Route::middleware('web')->group(function(){
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/comments', [CommentController::class, 'index'])->name('get.broadcastingRooms.comment');
    Route::post('/comments', [CommentController::class, 'store'])->name('store.broadcastingRooms.comment');
    Route::post('/broadcast/down', [BroadcastController::class, 'down'])->name('broadcast.down');
});


Route::get('/broadcasting', [BroadcastController::class, 'rooms']);
