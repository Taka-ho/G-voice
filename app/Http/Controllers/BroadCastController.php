<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BroadcastingRoom;
use App\Models\Broadcast;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BroadcastController extends Controller
{
    //音声配信ルームについてのController
    public function index()
    {
        $broadcasting = DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(15);
        return Inertia::render('Broadcast/BroadcastingRooms/InfiniteScroll', ['broadcasting' => $broadcasting]);
    }

    private function down(Request $request)
    {
        
    }

    public function createRoom(Request $request)
    {
        Inertia::render('Broadcast/NewRoom');
        $register = new Broadcast;
        $userId = $register->registerInfo($request);
        return $this->GoToRoom($userId);
    }

    public function GoToRoom($userId)
    {
        $roomId = DB::table('broadcasting_rooms')->where('user_id', $userId)->first();
        return redirect()->route("broadcast.insideRoom", ['roomId' => $roomId->id]);
    }

    public function BroadcastRoom($userId)
    {
        return Inertia::render('Broadcast/InsideRoom/BroadcastRoom');
    }

    public function update(Request $request)
    {
        $user = $request->user(); // ユーザー情報を取得する方法に合わせて変更してください
        $code = $request->input('code');

        event(new CodeChangeEvent($user, $code));

        return response()->json();
    }

    public function streamAudio(Request $request)
    {
        return Inertia::render('Broadcast/InsideRoom/ViewerDashboard');
    }
}
