<?php

namespace App\Models;

use DragonCode\Support\Facades\Helpers\Boolean;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Jobs\RunContainerProcess;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PharData;
/**
 * ディレクトリの中身を再帰的にアーカイブに追加する関数
 *
 * @param PharData $tar           アーカイブするPharDataオブジェクト
 * @param string   $directoryPath アーカイブするディレクトリのパス
 * @param int      $basePathLength ベースパスの長さ（アーカイブ内のパスを適切に設定するため）
 */
class Broadcast extends Model
{
    use HasFactory;

    public function BroadcastingRooms(): string
    {
        //配信中の部屋のリストを取得する。broadcastsテーブルのbroadcasting_flagカラムが1(配信中)のものが条件。
        return DB::table('broadcasting_rooms')->where('broadcasting_flag', 1)->paginate(100);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function checkBroadcasting($userId)
    {
        $item = DB::table('broadcasting_rooms')->where('user_id', $userId)->first();
        if (!$item) {
            return true;
        } else {
            return false;
        }
    }

    public function registerInfo($request)
    {
        $userId = Auth::user()->id;
        if ($this->checkBroadcasting($userId))
        {
            $title = $request->title;
            $broadcastExplain = $request->broadcastExplain;
            $broadcastingFlag = 1;
            $startOfBroadcast = now();
    
            DB::insert("INSERT INTO broadcasting_rooms (user_id, room_names, room_explain, broadcasting_flag, created_at) VALUES (?, ?, ?, ?, ?)", [
                $userId, 
                $title, 
                $broadcastExplain, 
                $broadcastingFlag,
                $startOfBroadcast
            ]);
            return $userId;
        } else {
            return $userId;
        }
    }

    public function setDir($usersCodes, $triggerFilePath)
    {
        // ルートディレクトリ名の生成
        $rootDirName = Str::uuid();
        $rootDirPath = 'usersDir/' . $rootDirName;
        $this->createDirectory($rootDirPath);
    
        // idが1のディレクトリをrootDirName直下に配置する
        if (isset($usersCodes['id']) && $usersCodes['name']) {
            $this->processCode($usersCodes, $rootDirPath, true);
        } else {
            // 子要素の処理
            foreach ($usersCodes['children'] as $code) {
                $this->processCode($code, $rootDirPath);
            }
        }
        $this->controllerOfContainer($rootDirPath, $triggerFilePath);
    }
    
    private function processCode($code, $parentDirPath, $isRoot = false)
    {
        if ($isRoot) {
            // idが1のディレクトリの場合
            $dirName = $code['name']; // リクエストで送られてくるフォルダ名を使用
            $dirPath = $parentDirPath . '/' . $dirName; // エスケープ処理を削除
            $this->createDirectory($dirPath);
    
            // 子要素の再帰的処理
            if (isset($code['children'])) {
                foreach ($code['children'] as $childCode) {
                    $this->processCode($childCode, $dirPath);
                }
            }
        } else {
            if (isset($code['children'])) {
                // 子要素がディレクトリの場合
                $dirName = $code['name']; // リクエストで送られてくるフォルダ名を使用
                $dirPath = $parentDirPath . '/' . $dirName; // エスケープ処理を削除
                $this->createDirectory($dirPath);
    
                // 子要素の再帰的処理
                foreach ($code['children'] as $childCode) {
                    $this->processCode($childCode, $dirPath);
                }
            } else {
                // 子要素がファイルの場合
                $fileName = $code['name'];
                $filePath = $parentDirPath . '/' . $fileName; // エスケープ処理を削除
                $content = isset($code['content']) ? $code['content'] : '';
                $this->createFile($filePath, $content);
            }
        }
    }
    
    private function createDirectory($path)
    {
        if (!file_exists($path)) {
            Storage::makeDirectory($path);
        }
    }
    
    private function createFile($filePath, $content)
    {
        // $content が配列の場合は文字列に変換する
        if (is_array($content)) {
            // 例として、配列をJSON文字列に変換する
            $content = json_encode($content);
        }
    
        // ファイル名に拡張子が含まれているかチェック
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        if (empty($extension)) {
            // 拡張子がない場合は.txtを追加
            $filePath .= '.txt';
        }
    
        Storage::put($filePath, $content);
    }        

    //実行する前にホストOS上でdocker pull ubuntu:latestコマンドを実行してUbuntuイメージを取得する必要がある。
    public function controllerOfContainer($rootDirPath, $triggerFilePath)
    {
        RunContainerProcess::dispatch($rootDirPath, $triggerFilePath);
    }
    public function removeContainer()
    {
        
    }
}
