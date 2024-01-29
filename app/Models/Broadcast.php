<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class Broadcast extends Model
{
    use HasFactory;

    public function registerInfo($request): string
    {
        $userId = Auth::user()->id;
        $title = $request->title;
        $broadcastExplain = $request->broadcastExplain;
        $broadcastingFlag = 1;
        $startOfBroadcast = now();

        DB::insert("INSERT INTO broadcasts (user_id, room_names, room_explain, source_code_of_users, broadcasting_flag, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
            $userId, 
            $title, 
            $broadcastExplain, 
            'console.log("Hello World");',
            $broadcastingFlag,
            $startOfBroadcast
        ]);        
        return $userId;
    }
}
