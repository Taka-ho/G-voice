<?php

namespace App\Models;

use GuzzleHttp\Client;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

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

    public function manageContainer()
    {
//        $userId = Auth::user()->id;
        $param = array(
            'Image' => 'ubuntu',
            'Cmd' => ['echo', 'Hello, World!'], // コマンドを指定
          );
        $url = 'http://host.docker.internal:2375/containers/create';
        $contents_array = $this->makeContainer($url, $param);
        $id = $contents_array['Id'];
        Log::debug('$idの値：'.$id);
        $startURL = "http://host.docker.internal:2375/containers/$id/start";
        $this->startContainer($startURL);
        $this->runCode();
    }

    private function makeContainer($url, $param)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($param));
        $response = curl_exec($ch);

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    
        // ステータスコードが200番台でなければエラーハンドリング
        if ($statusCode < 200 || $statusCode >= 300) {
            // エラーメッセージをログ出力
            Log::error("HTTP Error(make): $statusCode");
            return null;
        }

        // レスポンスを配列にデコード
        $contents_array = json_decode($response, true);
        Log::debug(print_r($contents_array, true));
        return $contents_array;
    }

    private function startContainer ($startURL)
    {
        $ch = curl_init($startURL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_POST, true);
        $response = curl_exec($ch);

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // ステータスコードが200番台でなければエラーハンドリング
        if ($statusCode < 200 || $statusCode >= 300) {
            // エラーメッセージをログ出力
            Log::error("HTTP Error(start): $statusCode");
            return null;
        }
    
        // レスポンスを配列にデコード
        $contents_array = json_decode($response, true);
        return $contents_array;
    }

    private function runCode()
    {
//        $containerId = Redis::get($userId);
    }
    
}
