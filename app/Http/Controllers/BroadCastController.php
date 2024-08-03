<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Broadcast;
use Inertia\Inertia;
use App\Events\EndBroadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BroadcastController extends Controller
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

        if (DB::table('broadcasting_rooms')->where($userId) && $broadcastId == $userId) {
            return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
        } else {
            return redirect()->route("broadcast.index");
        }
    }

    public function streamAudio(Request $request)
    {
        return Inertia::render('Broadcast/InsideRoom/AllBroadcasting');
    }

    public function runCode(Request $request)
    {
        // リクエストの全データを取得
        $requestData = $request->all();
        // codeOfUserからファイルの対応関係を取得
        $treeData = json_decode($requestData['treeData'], true);
        //Log::debug(reset($treeData['children']));
        $codeOfUser = $requestData['codeOfUser'];

        $usersCodes = $this->updateTreeDataContent($treeData, $codeOfUser);
        //Log::debug($usersCodes);
        $triggerFilePath = $request->input('triggerFilePath');
        $runCode = new Broadcast;
        $runCode->setDir($usersCodes, $triggerFilePath);
    }    
    
    function updateTreeDataContent(&$treeData, $codeOfUser) {
        foreach ($treeData['children'] as &$child) {
            if (isset($child['children'])) {
                // 子フォルダがある場合、再帰的に処理
                $this->updateTreeDataContent($child, $codeOfUser);
            } else {
                // ファイルのIDをチェック
                $fileIndex = array_search($child['id'], $codeOfUser['files']);
                if ($fileIndex !== false) {
                    // 該当するファイルIDが見つかった場合、contentを更新
                    $child['content'] = $codeOfUser['content'][$fileIndex];
                }
            }
        }
        return $treeData;
    }
}
