<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\HttpCache\ResponseCacheStrategy;

class BroadcastRoomController extends Controller
{
    //ユーザーが配信をする際の、配信部屋を作るコントローラー
    public function index ()
    {
        return \DB::table('broadcasts')->get();
    }

    private function start()
    {
        return 'start';
    }

    private function down(Request $request)
    {

    }

    private function toInsideRoom(Request $request)
    {

    }
}
