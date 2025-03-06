<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Broadcast;
use App\Models\CodeOfUser;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Providers\RouteServiceProvider;

class BroadCastController extends Controller
{
    //配信ルームについてのController

    public function Index() 
    {
        $this->RoomsList();
        return redirect(RouteServiceProvider::HOME);
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
            $register = new Broadcast;
            $register->stopBroadcast();
            return response()->json(['message' => 'Broadcast stopped successfully.']);
        } catch (\Exception $e) {
            \Log::error("Error stopping broadcast: " . $e->getMessage());
            return response()->json(['error' => 'Failed to stop broadcast.'], 500);
        }
    }

    public function GoToRoom($userIdAndContainerId)
    {
        // Decode the JSON content from the response
        $data = json_decode($userIdAndContainerId->getContent(), true);
        // Extract userId
        if (isset($data['userId'])) {
            $userId = $data['userId'];
        } else {
            Log::error('userId not found');
            return response()->json(['error' => 'userId not found'], 400);
        }

        // Extract containerId directly
        if (isset($data['containerId'])) {
            $containerId = $data['containerId']; // 修正: 直接containerIdを取得
        } else {
            Log::error('containerId not found');
            return response()->json(['error' => 'エラーが発生しました。しばらくしてからアクセスしてください'], 400);
        }

        if ($userId) {
            return redirect()->route("broadcast.insideRoom", [
                'userId' => $userId,
                'containerId' => $containerId
            ]);
        } else {
            Log::error('No room found for user_id: ' . $userId);
            return response()->json(['error' => 'エラーが発生しました。しばらくしてからアクセスしてください'], 404);
        }
    }

    public function BroadcastRoom(Request $request)
    {
        $userId = Auth::user()->id;

        if (DB::table('broadcasting_rooms')->where('user_id', $userId)->exists()) {
            return Inertia::render("Broadcast/InsideRoom/AllBroadcasting");
        } else {
            return redirect()->route("broadcast.index");
        }
    }

    public function createRoom(Request $request)
    {
        Inertia::render('Broadcast/NewRoom');
        $register = new Broadcast;
        $userIdAndContainerId = $register->registerInfo($request);

        return $this->GoToRoom($userIdAndContainerId);
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
