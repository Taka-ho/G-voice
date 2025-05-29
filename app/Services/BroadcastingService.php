<?php

namespace App\Services;

use App\Models\BroadcastingRoom;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

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

        $this->setContainerIdAndBroadcastingRoomId($broadcastingRoomId, $containerId);
        return $broadcastingRoomId;
    }

    private function setContainerIdAndBroadcastingRoomId($broadcastingRoomId, $containerId)
    {
        $key = "broadcast:{$broadcastingRoomId}";
        $value = [
            'container_id' => $containerId,
            'broadcastingRoomId' => $broadcastingRoomId,
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

    public function stopBroadcast()
    {
        $userId = Auth::user()->id;
        
        // 最後のブロードキャスティングルームを取得
        $broadcastingRoom = BroadcastingRoom::where('user_id', $userId)
            ->orderBy('created_at', 'desc') // created_atで降順にソート
            ->first();
    
        if ($broadcastingRoom) {
            $roomId = $broadcastingRoom->id;
            $containerId = $broadcastingRoom->container_id;
    
            try {
                // コンテナのログを取得
                $containerLog = $this->getContainerLog($containerId);

                // コンテナログをデータベースに更新
                DB::table('container_logs')->where('user_id', $userId)->update(['container_log' => $containerLog['containerLog']]);

                // ブロードキャスティングルームのフラグを更新
                DB::table('broadcasting_rooms')->where('id', $roomId)->update(['broadcasting_flag' => '0']);

                // コンテナを停止
                $this->stopContainerOfUser($containerId);

                Log::info("Broadcast stopped successfully for user ID: $userId, Room ID: $roomId");

                return response()->json(['message' => 'Broadcast stopped successfully.']);
            } catch (\Exception $e) {
                Log::error("Error stopping broadcast for user ID: $userId, Room ID: $roomId - " . $e->getMessage());
                return response()->json(['error' => 'Failed to stop broadcast.'], 500);
            }
        } else {
            Log::warning("No broadcasting room found for user ID: $userId");
            return response()->json(['error' => 'No broadcasting room found.'], 404);
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
        if ($activeRoomOfUser != null) {
            // JSON形式のデータをデコード
            $activeRoomOfUser = BroadcastingRoom::where(['user_id' => $userId, 'broadcasting_flag' => 1])->first();

            if ($activeRoomOfUser == null) {
                return null; // ルームが存在しない場合はnullを返す
            }

            // idを取得
            $broadcastingRoomId = $activeRoomOfUser->id;
        }

        return $broadcastingRoomId;
    }
}
