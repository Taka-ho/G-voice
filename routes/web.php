<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BroadcastController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::get('/', [BroadcastController::class, 'index'])->name('broadcast.index');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/broadcast/start', function () {
        return Inertia::render('Broadcast/NewRoom');
    })->name('broadcast.start');

    Route::post('/broadcast/create', [BroadcastController::class, 'createRoom'])->name('broadcast.create');
    Route::get('/broadcast/down/{id}', [BroadcastController::class, 'down'])->name('broadcast.down');
    Route::get('/broadcast/{userId}', [BroadcastController::class, 'BroadcastRoom'])->name('broadcast.insideRoom');
    Route::get('/broadcast/stream/{id}', [BroadcastController::class, 'streamAudio']);    
});

require __DIR__.'/auth.php';