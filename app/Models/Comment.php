<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['comment']; // フィールド名を修正
    protected $table = 'broadcasting_rooms_comments';

    public function broadcastingRoom(): BelongsTo
    {
        return $this->belongsTo(BroadcastingRoom::class);
    }

    public function insertComment($request)
    {
        $requestBody = file_get_contents('php://input');
    
        // JSON文字列を連想配列に変換
        $jsonData = json_decode($requestBody, true);
    
        // "text" フィールドの値を取得
        $commentText = $jsonData['text'];
        $comment = new Comment();
        $referer = $request->headers->get('referer'); // リクエストの Referer を取得
        //refererが配信者・視聴者のどちらかのURLかを判定
        if (strpos($referer, "http://localhost/broadcast/") !== false) {
            //視聴者の場合
            if(strpos($referer, "http://localhost/broadcast/stream") !== false) {
                $pattern = "http://localhost/broadcast/stream/";
                $broadcastId = str_replace($pattern, "", $referer);
                $comment->broadcasting_rooms_id = $request->input('broadcasting_rooms_id', (int)$broadcastId);
                $comment->comment = $request->input('comment', $commentText);
                $comment->save();
                return $comment;
            //配信者の場合
            } else {
                $pattern = "http://";
                $url = str_replace($pattern, "", $referer);
                $parts = explode("/", $url);
                
                if (count($parts) >= 3) {
                    $userId = $parts[2];
                    $containerId = null;
                    if (strpos($userId, '?') !== false) {
                        $userIdParts = explode('?', $userId);
                        $userId = $userIdParts[0];
                        $containerId = $userIdParts[1];
                    }
                
                    $broadcastId = DB::table('broadcasting_rooms')
                                    ->where('user_id', $userId)
                                    ->value('id');
                
                    if ($broadcastId) {
                        // $broadcastIdが取得できている場合の処理
                        $comment->broadcasting_rooms_id = $broadcastId;
                        $comment->comment = $request->input('comment', $commentText);
                        $comment->save();
                        return $comment;
                    } else {
                        // $broadcastIdが取得できない場合の処理
                        return response()->json(['error' => 'broadcasting_rooms_idが取得できませんでした'], 400);
                    }
                } else {
                    // URLの形式が不正な場合の処理
                    return response()->json(['error' => 'URLの形式が不正です'], 400);
                }
            }
        }
    }
}
