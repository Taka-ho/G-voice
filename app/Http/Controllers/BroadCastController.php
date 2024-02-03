<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Broadcast;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BroadCastController extends Controller
{
    //音声配信ルームについてのController
    public function index ()
    {
        Inertia::render('Broadcast/BroadcastingRooms');
        $index = new Broadcast;
        $userId = $index->broadcastingRooms();
    }

    private function down(Request $request)
    {

    }

    public function createRoom(Request $request)
    {
        Inertia::render('Broadcast/NewRoom');
        $register = new Broadcast;
        $userId = $register->registerInfo($request);
        return $this->goToRoom($userId);
    }

    public function goToRoom($userId)
    {
        $roomId = DB::table('broadcasts')->where('user_id', $userId)->first();
        return redirect()->route("broadcast.insideRoom", ['roomId' => $roomId->id]);
    }

    public function BroadcastRoom($userId)
    {
        return Inertia::render('Broadcast/InsideRoom/BroadcastRoom');
    }
}
