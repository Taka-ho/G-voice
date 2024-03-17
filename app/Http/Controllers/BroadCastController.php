<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\EndBroadcast;
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

    public function down(Request $request)
    {
        $userId = Auth::user()->id;
        
        event(new EndBroadcast());
        $referer = $request->headers->get('referer');
        if (strpos($referer, "http://localhost/broadcast/") !== false) {
            $pattern = "http://localhost/broadcast/";
            $broadcastId = str_replace($pattern, "", $referer);
            if ($userId == $broadcastId) {
                DB::table('broadcasting_rooms')->where('user_id', $userId)->update(['broadcasting_flag' => 0]);
            }
            
        }
        return response()->json();
    }

    public function createRoom(Request $request)
    {
        Inertia::render('Broadcast/NewRoom');
        $broadcast = new Broadcast;
        $userId = $broadcast->registerInfo($request);
        $broadcast->manageContainer ();
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

        if (DB::table('broadcasting_rooms')->where($userId) && $broadcastId == $userId) {
            return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
        } else {
            return redirect()->route("broadcast.index");
        }
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $code = $request->input('code');

        event(new CodeChangeEvent($user, $code));

        return response()->json();
    }

    public function streamAudio(Request $request)
    {
        return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
    }
}
