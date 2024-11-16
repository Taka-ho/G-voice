<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

use PharData;
/**
 * ディレクトリの中身を再帰的にアーカイブに追加する関数
 *
 * @param PharData $tar           アーカイブするPharDataオブジェクト
 * @param string   $directoryPath アーカイブするディレクトリのパス
 * @param int      $basePathLength ベースパスの長さ（アーカイブ内のパスを適切に設定するため）
 */
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
        $containerId = $this->startContainer();

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

            // RedisにユーザーIDとコンテナIDを保存
            Redis::hset('user_to_container', $userId, $containerId);
            return response()->json(['userId' => $userId, 'containerId' => $containerId]);
        } else {
            // RedisにユーザーIDとコンテナIDを保存
            Redis::hset('user_to_container', $userId, $containerId);
            return response()->json(['userId' => $userId, 'containerId' => $containerId], 200);
        }
    }

    public function startContainer()
    {
        $containerName = Str::uuid()->toString(); // ユニークな名前を生成
    
        // コンテナ作成パラメータ
        $param = [
            'Image' => 'users-container',
            'name' => $containerName, // ここでコンテナ名を設定
        ];
    
        $createUrl = "http://host.docker.internal:2375/containers/create";
    
        // コンテナ作成リクエスト
        $responseOfCreated = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($createUrl, $param);

        // コンテナ作成が成功したか確認
        if ($responseOfCreated->failed()) {
            return response()->json(['error' => 'Failed to create container'], 500);
        }
        // コンテナIDを取得
        $containerId = $responseOfCreated->json('Id');
        $startURL = "http://host.docker.internal:2375/containers/{$containerId}/start";

        // コンテナ起動リクエスト
        $responseOfStarted = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($startURL);
        // コンテナ起動が成功したか確認
        if ($responseOfStarted->failed()) {
            return response()->json(['error' => 'Failed to start container'], 500);
        }

        return response()->json(['containerId' => $containerId]);
    }

    public function watchFileTree() {

    }
    public function executeCommand($command)
    {
        
    }

    public function removeContainer()
    {
        
    }
}
