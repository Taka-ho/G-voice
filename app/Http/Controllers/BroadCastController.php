<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BroadCastController extends Controller
{
    //音声配信
    public function index ()
    {
        $data = \DB::table('broadcasts')->get();
        if ($data) {
            Log::debug('Log:'. $data);
            return $data;
        } else {
            $data = 'aaa';
            Log::debug('Log:'. $data);
            return $data;
        }
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
