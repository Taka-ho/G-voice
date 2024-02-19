<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BroadcastingRoom;
use App\Models\Broadcast;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class BroadcastController extends Controller
{
    //音声配信ルームについてのController
    public function indexPage()
    {
        return Inertia::render('Broadcast/BroadcastingRooms/InfiniteScroll');
    }

    public function rooms()
    {
        $broadcasting = DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(30);
        return response()->json($broadcasting);
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

    public function BroadcastRoom(Request $request)
    {
        $accessURL = $request->fullUrl();
        $userId = Auth::user()->id;
        $pattern = "http://localhost/broadcast/";
        $broadcastId = str_replace($pattern, "", $accessURL);

        if(DB::table('broadcasting_rooms')->where($userId) && $broadcastId == $userId) {
            return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
        } else {
            return redirect()->route("broadcast.index");
        }
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
        return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
    }
}
