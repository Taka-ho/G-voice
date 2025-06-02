<?php

namespace App\Services;

use App\Models\BroadcastingRoom;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use App\Services\RouteServiceProvider;

class BroadcastingService
{
    public function checkBroadcasting($userId)
    {
        $item = BroadcastingRoom::where('user_id', $userId)->first();
        return $item ? false : true;
    }

    public function registerInfo($request)
    {
        $userId = Auth::user()->id;

        // すでにユーザーが配信を立ち上げている場合、そのユーザーが立ち上げているルームに遷移させる
        $activeRoomIdOfUser = $this->findAlreadyActiveRoom($userId);
        if ($activeRoomIdOfUser != null) {
            return $activeRoomIdOfUser;
        }

        $containerResponse = $this->startContainer();
        $containerId = $containerResponse['containerId'];

        // アクティブなルームがない場合、新しいルームを作成
        $title = $request->title;
        $broadcastExplain = $request->broadcastExplain;
        $containerLog = $this->getContainerLog($containerId)['containerLog'];
        $broadcastingFlag = 1;
        $startOfBroadcast = now();

        // 配信部屋の情報をDBに登録し、IDを取得
        $broadcastingRoomId = BroadcastingRoom::insertGetId([
            'user_id' => $userId,
            'room_names' => $title,
            'room_explain' => $broadcastExplain,
            'broadcasting_flag' => $broadcastingFlag,
            'container_id' => $containerId,
            'created_at' => $startOfBroadcast,
        ]);

        // ユーザーのコンテナの情報をDBに登録
        DB::table('code_of_users')->insert([
            'user_id' => $userId,
            'broadcasting_id' => $broadcastingRoomId,
            'container_id' => $containerId,
            'tree_data' => null,
            'file_and_contents' => null,
            'created_at' => $startOfBroadcast,
        ]);

        // コンテナ起動時のログをテーブルにINSERT
        DB::table('container_logs')->insert([
            'user_id' => $userId,
            'container_id' => $containerId,
            'container_log' => $containerLog,
            'created_at' => $startOfBroadcast,
        ]);

        $this->setContainerIdAndBroadcastingRoomIdAndUserId($broadcastingRoomId, $containerId, $userId);
        return $broadcastingRoomId;
    }

    private function setContainerIdAndBroadcastingRoomIdAndUserId($broadcastingRoomId, $containerId, $userId)
    {
        $key = "broadcast:{$broadcastingRoomId}";
        $value = [
            'containerId' => $containerId,
            'broadcastingRoomId' => $broadcastingRoomId,
            'userId' => $userId
        ];

        Redis::hmset($key, $value);
    }

    private function startContainer()
    {
        $containerName = Str::uuid()->toString();
        $param = [
            'Image' => 'users-container',
            'name' => $containerName,
        ];

        $createUrl = "http://host.docker.internal:2375/containers/create";
        $responseOfCreated = Http::withHeaders(['Content-Type' => 'application/json'])->post($createUrl, $param);

        if ($responseOfCreated->failed()) {
            throw new \Exception('Failed to create container');
        }

        $containerId = $responseOfCreated->json('Id');
        $startURL = "http://host.docker.internal:2375/containers/{$containerId}/start";
        $responseOfStarted = Http::withHeaders(['Content-Type' => 'application/json'])->post($startURL);

        if ($responseOfStarted->failed()) {
            throw new \Exception('Failed to start container');
        }

        return ['containerId' => $containerId];
    }

    public function stopBroadcast($broadcastingRoomId, $userId, $unmountFlag)
    {
        if (!$broadcastingRoomId) {
            return response()->json(['error' => 'broadcastingRoomId is required'], 400);
        }
    
        // Redis から情報を取得
        $broadcastData = Redis::hgetall("broadcast:{$broadcastingRoomId}");
    
        if (empty($broadcastData)) {
            Log::warning("No broadcast data found in Redis for room ID: $broadcastingRoomId");
            return response()->json(['error' => 'No broadcast data found.'], 404);
        }
    
        $containerId = $broadcastData['containerId'];
        $userIdFromRedis = $broadcastData['userId']; // Redisに保存されていれば

        // 悪意のあるユーザーが違うユーザーのコンテンツを止めようとしている場合
        if ($userId != $userIdFromRedis) {
            Log::warning("User ID mismatch for room ID: $broadcastingRoomId");
            return response()->json(['error' => 'この配信をログアウトさせることはできません。'], 400);
        }

        try {
            // コンテナログを取得して DB に保存
            $containerLog = $this->getContainerLog($containerId);
            DB::table('container_logs')->where('user_id', $userId)->update([
                'container_log' => $containerLog['containerLog']
            ]);
    
            // broadcasting_flag を無効に
            DB::table('broadcasting_rooms')->where('id', $broadcastingRoomId)->update([
                'broadcasting_flag' => '0'
            ]);
    
            // コンテナ停止
            $this->stopContainerOfUser($containerId);
    
            // Redis のデータを削除（任意）
            Redis::del("broadcast:{$broadcastingRoomId}");
            Redis::del("user_broadcast:{$userId}");
    
            Log::info("Broadcast stopped successfully for Room ID: $broadcastingRoomId");
            if ($unmountFlag) {
                return redirect(RouteServiceProvider::HOME);
            }
            return response()->json(['message' => 'Broadcast stopped successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to stop broadcast for Room ID: $broadcastingRoomId - " . $e->getMessage());
            return response()->json(['error' => 'Failed to stop broadcast.'], 500);
        }
    }
    

    private function stopContainerOfUser($containerId)
    {
        $response = Http::post("http://host.docker.internal:2375/containers/{$containerId}/stop");

        if ($response->successful()) {
            return ['message' => 'Container stopped successfully.'];
        } else {
            throw new \Exception('Failed to stop container.');
        }
    }

    private function getContainerLog($containerId)
    {
        $getLogURL = "http://host.docker.internal:2375/containers/$containerId/logs?stdout=true&stderr=true";
        $containerLog = Http::withHeaders(['Content-Type' => 'application/json'])->get($getLogURL);

        if ($containerLog->failed()) {
            throw new \Exception('Failed to get container logs');
        }

        $rawLog = $containerLog->body();
        $decodedLog = mb_convert_encoding($rawLog, 'UTF-8', 'UTF-8');
        $cleanLog = preg_replace('/[\x00-\x1F\x7F]/', '', $decodedLog);

        return ['containerLog' => $cleanLog];
    }

    public function haveBroadcastingRoom()
    {
        $userId = Auth::user()->id; 
        // 現在のユーザーがアクティブなブロードキャスティングルームを持っているか確認
        $existingRoom = BroadcastingRoom::where('user_id', $userId)
            ->where('broadcasting_flag', 1)
            ->first();

        if ($existingRoom) {
            // IDを取得して変数に格納
            $broadcastingRoomId = $existingRoom->id;

            return [
                'result' => true,
                'broadcastingRoomId' => $broadcastingRoomId,
            ];
        }

        return [
            'result' => false,
            'broadcastingRoomId' => null, // ルームがない場合はnullを返す
        ];
    }

    private function findAlreadyActiveRoom($userId)
    {
        $activeRoomOfUser = BroadcastingRoom::where(['user_id' => $userId, 'broadcasting_flag' => 1])->first();
        $broadcastingRoomId;
        if ($activeRoomOfUser != null) {
            // JSON形式のデータをデコード
                    // idを取得
            $broadcastingRoomId = $activeRoomOfUser->id;

        }
        if ($activeRoomOfUser == null) {
            return null; // ルームが存在しない場合はnullを返す
        }

        return $broadcastingRoomId;
    }
}
