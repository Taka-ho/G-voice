<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BroadCastController extends Controller
{
    //音声配信
    public function index ()
    {
        return \DB::table('broadcasts')->get();
    }

    private function down(Request $request)
    {

    }

    private function toInsideRoom(Request $request)
    {

    }
}
