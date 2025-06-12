<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\CodeOfUser;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Providers\RouteServiceProvider;
use App\Services\BroadcastingService;
use App\Models\BroadcastingRoom;
use Illuminate\Support\Facades\Cache;

class BroadCastController extends Controller
{
    protected $broadcastingService;

    public function __construct(BroadcastingService $broadcastingService)
    {
        $this->broadcastingService = $broadcastingService;
    }

    // 配信ルームについてのController
    public function Index() 
    {
        return redirect(RouteServiceProvider::HOME);
    }

    public function BroadcastStart()
    {
        $user = Auth::user();

        return Inertia::render('Broadcast/NewRoom', [
            'user' => [
                'username' => $user->name
            ]
        ]);
    }
    

    public function RoomsList()
    {
        $ip = Request::ip(); // クライアントのIP取得
        $cacheKey = "roomlist:failures:{$ip}";
        $blockKey = "roomlist:block:{$ip}";

        // ブロックされていたら即レスポンス
        if (Cache::has($blockKey)) {
            return response()->json([
                'message' => 'Too many empty responses. Please try again after 5 minutes.',
                'data' => []
            ], 429); // 429 Too Many Requests
        }

        // データ取得
        $broadcasting = DB::table('broadcasting_rooms')
            ->where('broadcasting_flag', 1)
            ->paginate(15);

        if ($broadcasting->isEmpty()) {
            // 空データが返ってきた場合のカウント処理
            $failures = Cache::increment($cacheKey);
            Cache::put($cacheKey, $failures, now()->addMinutes(10)); // 失敗カウントを10分保持

            if ($failures >= 2) {
                // ブロック設定（5分）
                Cache::put($blockKey, true, now()->addMinutes(5));
            }

            return response()->json([
                'message' => 'No rooms found.',
                'data' => []
            ]);
        }

        // 成功時はカウントをリセット
        Cache::forget($cacheKey);
        return response()->json($broadcasting);
    }

    /**
     * Stops the broadcast specified by the given broadcastingRoomId.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function DownBroadcast(Request $request)
    {
        try {
            $broadcastingRoomId = $request->input('broadcastingRoomId');
            $userId = Auth::user()->id;
            $this->broadcastingService->stopBroadcast($broadcastingRoomId, $userId, false);
            return response()->json(['message' => 'Broadcast stopped successfully.']);
        } catch (\Exception $e) {
            Log::error("Error stopping broadcast: " . $e->getMessage());
            return response()->json(['error' => 'Failed to stop broadcast.'], 500);
        }
    }

    public function DownBroadcastFromUnmount(Request $request)
    {
        Log::debug('アンマウントされました');
        try {
            $broadcastingRoomId = $request->input('broadcastingRoomId');
            $userId = Auth::user()->id;
            $this->broadcastingService->stopBroadcast($broadcastingRoomId, $userId, true);
            return response()->json(['message' => 'Broadcast stopped successfully.']);
        } catch (\Exception $e) {
            Log::error("Error stopping broadcast: " . $e->getMessage());
            return response()->json(['error' => 'Failed to stop broadcast.'], 500);
        }
    }

    public function GoToRoom($broadcastingRoomId)
    {

        if ($broadcastingRoomId != null) {
            return redirect()->route("broadcast.insideRoom", [
                'broadcastingRoomId' => $broadcastingRoomId // 数値IDを渡す
            ]);
        } else {
            Log::error('No room found for broadcastingRoomId: ' . json_encode($broadcastingRoomId));
            return response()->json(['error' => 'エラーが発生しました。しばらくしてからアクセスしてください'], 404);
        }
    }

    public function BroadcastRoom($broadcastingRoomId)
    {
        $userId = Auth::user()->id;

        // ユーザーに関連するブロードキャスティングルームを取得
        $infoOfBroadcastingRoom = BroadcastingRoom::find($broadcastingRoomId);

        // ルームが存在しない場合
        if (!$infoOfBroadcastingRoom) {
            return redirect()->route("broadcast.start");
        }

        // 対象のuserIdがbroadcasting_roomsのidと一致しない場合は、ルーム作成のページにリダイレクトさせる
        if ($infoOfBroadcastingRoom->user_id != $userId) {
            return redirect()->route("broadcast.start");
        }

        return Inertia::render("Broadcast/InsideRoom/AllBroadcasting");
    }

    public function createRoom(Request $request)
    {
        $resultData = $this->broadcastingService->haveBroadcastingRoom();

        if ($resultData['result'] === true) {
            $broadcastingRoomId = $resultData['broadcastingRoomId']; // 数値の ID
            return $this->GoToRoom($broadcastingRoomId);
        }

        $broadcastingRoomId = $this->broadcastingService->registerInfo($request);

        // registerInfo の戻り値が数値 ID であることを前提
        return $this->GoToRoom($broadcastingRoomId);
    }

    public function streamAudio(Request $request)
    {
        return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
    }

    public function insertUsersCode(Request $request)
    {
        // リクエストからデータを取得
        $usersCode = $request->input('data');
        // UserCodeモデルのメソッドを呼び出し
        $userCode = new CodeOfUser;
        $userCode->insertUsersCode($usersCode);
    }

    public function getContainerId($broadcastingRoomId)
    {
        $containerId = $this->broadcastingService->getContainerId($broadcastingRoomId);
        return response()->json(['containerId' => $containerId]);
    }
}
