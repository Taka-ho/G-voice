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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function BroadcastingRooms(): string
    {
        //配信中の部屋のリストを取得する。broadcastsテーブルのbroadcasting_flagカラムが1(配信中)のものが条件。
        return DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(100);
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
        $containerResponse = $this->startContainer(); // JSONオブジェクトを取得    
        $containerId = $containerResponse->getData()->containerId; // JSONレスポンスからcontainerIdを取得

        if ($this->checkBroadcasting($userId))
        {
            $title = $request->title;
            $broadcastExplain = $request->broadcastExplain;
            $containerLog = $this->getContainerLog($containerId)->getData()->containerLog;
            $broadcastingFlag = 1;
            $startOfBroadcast = now();
    
            // 配信部屋の情報をDBに登録し、IDを取得
            $broadcastingRoomId = DB::table('broadcasting_rooms')->insertGetId([
                'user_id' => $userId,
                'room_names' => $title,
                'room_explain' => $broadcastExplain,
                'broadcasting_flag' => $broadcastingFlag,
                'container_id' => $containerId,
                'created_at' => $startOfBroadcast,
            ]);
    
            // ユーザーのコンテナの情報をDBに登録させる
            DB::table('users_codes')->insert([
                'user_id' => $userId,
                'broadcasting_id' => $broadcastingRoomId, // broadcasting_rooms テーブルのIDを登録
                'container_id' => $containerId,
                'tree_data' => null,
                'file_and_contents' => null,
                'created_at' => $startOfBroadcast,
            ]);

            // コンテナ起動時のログをテーブルにINSERTさせる
            DB::table('container_logs')->insert([
                'user_id' => $userId,
                'container_id' => $containerId,
                'container_log' => $containerLog,
                'created_at' => $startOfBroadcast,
            ]);
            return response()->json(['userId' => $userId, 'containerId' => $containerId]);
        } else {
            // RedisにユーザーIDとコンテナIDを保存
            return response()->json(['userId' => $userId, 'containerId' => $containerId], 200);
        }
    }

    private function startContainer()
    {
        $containerName = Str::uuid()->toString();
    
        $param = [
            'Image' => 'users-container',
            'name' => $containerName,
        ];
    
        $createUrl = "http://host.docker.internal:2375/containers/create";
    
        $responseOfCreated = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($createUrl, $param);
    
        if ($responseOfCreated->failed()) {
            throw new \Exception('Failed to create container');
        }
    
        $containerId = $responseOfCreated->json('Id');
        $startURL = "http://host.docker.internal:2375/containers/{$containerId}/start";
    
        $responseOfStarted = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($startURL);
    
        if ($responseOfStarted->failed()) {
            throw new \Exception('Failed to start container');
        }
    
        return ['containerId' => $containerId]; // JSONResponseではなく、配列を返す
    }

    // ユーザーが配信で使用したコンテナを、配信を削除する際に停止させるメソッド
    public function stopBroadcast()
    {
        $userId = Auth::user()->id;
    
        // ユーザーIDに基づいてbroadcasting_roomsからデータを取得
        $broadcastingRoom = BroadcastingRoom::where('user_id', $userId)->first();
    
        // データが存在するか確認
        if ($broadcastingRoom) {
            // 各カラムの値を変数に格納
            $roomId = $broadcastingRoom->id;
            $roomNames = $broadcastingRoom->room_names;
            $containerId = $broadcastingRoom->container_id;
            $roomExplain = $broadcastingRoom->room_explain;
            $broadcastingFlag = $broadcastingRoom->broadcasting_flag;

            $containerLog = $this->getContainerLog($containerId);

            $insertDataOfContainerLog = ([
                'container_log' => $containerLog
            ]);

            DB::table('container_logs')
                ->where('id', $userId)
                ->update($insertDataOfContainerLog);
            $data = ([
                'broadcasting_flag' => '0'
            ]);

            DB::table('broadcasting_rooms')
                ->where('id', $roomId)
                ->update($data);
            $this->stopContainerOfUser($containerId);
        }
    }

    private function stopContainerOfUser($containerId)
    {
        // コンテナを停止するリクエストを送信
        $response = Http::post("http://host.docker.internal:2375/containers/{$containerId}/stop");

        // レスポンスの確認
        if ($response->successful()) {
            return response()->json(['message' => 'Container stopped successfully.']);
        } else {
            return response()->json(['error' => 'Failed to stop container.'], $response->status());
        }
    }
    private function getContainerLog($containerId)
    {
        $getLogURL = "http://host.docker.internal:2375/containers/$containerId/logs?stdout=true&stderr=true";
        $containerLog = Http::withHeaders(['Content-Type' => 'application/json'])
            ->get($getLogURL);
    
        if ($containerLog->failed()) {
            throw new \Exception('Failed to get container logs');
        }
    
        $rawLog = $containerLog->body();
        $decodedLog = mb_convert_encoding($rawLog, 'UTF-8', 'UTF-8');
        $cleanLog = preg_replace('/[\x00-\x1F\x7F]/', '', $decodedLog);
    
        return ['containerLog' => $cleanLog]; // JSONResponseではなく、配列を返す
    }
}
