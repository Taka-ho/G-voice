<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Broadcast extends Model
{
    use HasFactory;

    public function index(): string
    {
        //配信中の部屋のリストを取得する。broadcastsテーブルのbroadcasting_flagカラムが1のものが条件。
        return \DB::table('broadcasts')->where('broadcasting_flag', 1)->get();
    }

    private function relationWithUser(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function registerInfo($request): string
    {
        $userId = Auth::user()->id;
        $title = $request->title;
        $broadcastExplain = $request->broadcastExplain;
        $broadcastingFlag = 1;
        $startOfBroadcast = now();

        DB::insert("INSERT INTO broadcasts (user_id, room_names, room_explain, broadcasting_flag, created_at) VALUES (?, ?, ?, ?, ?)", [
            $userId, 
            $title, 
            $broadcastExplain, 
            $broadcastingFlag,
            $startOfBroadcast
        ]);        
        return $userId;
    }
}
