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
        $broadcasting = DB::table('broadcasting_rooms')
            ->where('broadcasting_flag', 1)
            ->paginate(15);

        // JSON形式で返す
        return response()->json($broadcasting);
    }

    public function DownBroadcast()
    {
        try {
            $this->broadcastingService->stopBroadcast();
            return response()->json(['message' => 'Broadcast stopped successfully.']);
        } catch (\Exception $e) {
            Log::error("Error stopping broadcast: " . $e->getMessage());
            return response()->json(['error' => 'Failed to stop broadcast.'], 500);
        }
    }

    public function GoToRoom($broadcastingRoomId)
    {
        Log::debug($broadcastingRoomId);
    
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
}
