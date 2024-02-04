<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class BroadcastingRoom extends Model
{
    use HasFactory;

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function registerInfo($request): string
    {
        $userId = Auth::user()->id;
        $title = $request->title;
        $broadcastExplain = $request->broadcastExplain;
        $broadcastingFlag = 1;
        $startOfBroadcast = now();

        DB::insert("INSERT INTO broadcasting_rooms (user_id, room_names, room_explain, broadcasting_flag, created_at) VALUES (?, ?, ?, ?, ?)", [
            $userId, 
            $title, 
            $broadcastExplain, 
            $broadcastingFlag,
            $startOfBroadcast
        ]);        
        return $userId;
    }
}
