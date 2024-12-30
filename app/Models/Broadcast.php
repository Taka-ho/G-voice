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
            $containerLog = $this->getContainerLog($containerId);
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
            return response()->json(['userId' => $userId, 'containerId' => $containerId]);
        } else {
            // RedisにユーザーIDとコンテナIDを保存
            return response()->json(['userId' => $userId, 'containerId' => $containerId], 200);
        }
    }

    private function startContainer()
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

    private function getContainerLog($containerId)
    {
        $getLogURL = "http://host.docker.internal:2375/containers/$containerId/logs";
        $containerLog = Http::withHeaders(['Content-Type' => 'application/json'])
        ->get($getLogURL);
        // コンテナ起動が成功したか確認
        if ($containerLog->failed()) {
            return response()->json(['error' => 'Failed to start container'], 500);
        }
        return response()->json(['containerLog' => $containerLog]);
    }

    public function removeContainer()
    {
        
    }
}
