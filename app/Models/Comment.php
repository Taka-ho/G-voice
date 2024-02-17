<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

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
        if ($referer) {
            //refererが配信者・視聴者のどちらかのURLかを判定
            if (strpos($referer, "http://localhost/broadcast/") !== false) {
                //視聴者の場合
                if(strpos($referer, "http://localhost/broadcast/stream") !== false) {
                    $pattern = "http://localhost/broadcast/stream/";
                    $broadcastId = str_replace($pattern, "", $referer);
                    $comment->broadcasting_rooms_id = $request->input('broadcasting_rooms_id', (int)$broadcastId);
                    $comment->comment = $request->input('comment', $commentText);
                    $comment->save();
                //配信者の場合
                } else {
                    $pattern = "http://localhost/broadcast/";
                    $broadcastId = str_replace($pattern, "", $referer);
                    $comment->broadcasting_rooms_id = $request->input('broadcasting_rooms_id', (int)$broadcastId);
                    $comment->comment = $request->input('comment', $commentText);
                    $comment->save();
                }
            }
        }
    }
}
