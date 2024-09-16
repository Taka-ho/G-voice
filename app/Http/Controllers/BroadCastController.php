<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Broadcast;
use Inertia\Inertia;
use App\Events\EndBroadcast;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class BroadCastController extends Controller
{
    //配信ルームについてのController
    public function index()
    {
        $broadcasting = DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(15);
        return Inertia::render('Broadcast/BroadcastingRooms/InfiniteScroll', ['broadcasting' => $broadcasting]);
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

    public function GoToRoom($userIdAndContainerId)
    {
        // Decode the JSON content from the response
        $data = json_decode($userIdAndContainerId->getContent(), true);
    
        // Log the decoded data structure
        Log::debug('Decoded data structure: ' . print_r($data, true));
    
        // Extract userId
        if (isset($data['userId'])) {
            $userId = $data['userId'];
        } else {
            Log::error('userId not found');
            return response()->json(['error' => 'userId not found'], 400);
        }
    
        // Extract containerId from nested structure
        if (isset($data['containerId']['original']['containerId'])) {
            $containerId = $data['containerId']['original']['containerId'];
        } else {
            Log::error('containerId not found');
            return response()->json(['error' => 'あああ'], 400);
        }

        Log::debug('containerIdの値：' . $containerId);
    
        if ($userId) {
            Log::debug('Room found: ' . print_r($userId, true));
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
        $accessURL = $request->fullUrl();
        $userId = Auth::user()->id;
        $pattern = "http://localhost/broadcast/";
        $broadcastId = str_replace($pattern, "", $accessURL);
    
        if (DB::table('broadcasting_rooms')->where('user_id', $userId)->exists()) {
            $containerId = Redis::get("user_to_container", $userId);
            return Inertia::render("Broadcast/InsideRoom/AllBroadcasting", [
                'userId' => $userId,
                'containerId' => $containerId,
            ]);
        } else {
            return redirect()->route("broadcast.index");
        }
    }
    

    public function createRoom(Request $request)
    {
        Inertia::render('Broadcast/NewRoom');
        $register = new Broadcast;
        $userId = $register->registerInfo($request);
        return $this->GoToRoom($userId);
    }

    public function executeCommandOfTerminal(Request $request)
    {
        $command = $request->input('command');
        $containerName = 'terminal'; // The name of your Docker container

        // Create the command to be executed inside the Docker container
        $dockerCommand = ['docker', 'exec', $containerName, 'bash', '-c', $command];

        $process = new Process($dockerCommand);
        $process->run();

        // Check if the command was successful
        if (!$process->isSuccessful()) {
            //Log::debug(response()->json(['error' => $process->getErrorOutput()], 500));
            return response()->json(['error' => $process->getErrorOutput()], 500);
        }

        // Return the output of the command
        //Log::debug(response()->json(['output' => $process->getOutput()]));
        return response()->json(['output' => $process->getOutput()]);
    }

    public function streamAudio(Request $request)
    {
        return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
    }

}
