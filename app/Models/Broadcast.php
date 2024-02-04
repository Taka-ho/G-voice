<?php

namespace App\Models;

use DragonCode\Support\Facades\Helpers\Boolean;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use SebastianBergmann\Type\VoidType;

class Broadcast extends Model
{
    use HasFactory;

    public function BroadcastingRooms(): string
    {
        //配信中の部屋のリストを取得する。broadcastsテーブルのbroadcasting_flagカラムが1(配信中)のものが条件。
        return DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(100);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function checkBroadcasting($userId)
    {
        $item = DB::table('broadcasting_rooms')->where('user_id', $userId)->first();
        if (!$item) {
            return true;
        } else {
            return false;
        }
    }

    public function registerInfo($request)
    {
        $userId = Auth::user()->id;
        if ($this->checkBroadcasting($userId))
        {
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
        } else {
            return $userId;
            
        }

    }
}
