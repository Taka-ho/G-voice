<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['comment']; // フィールド名を修正
    protected $table = 'broadcasting_rooms_comments';

    public function broadcastingRoom(): BelongsTo
    {
        return $this->belongsTo(BroadcastingRoom::class);
    }

    public function getComments($request)
    {
        $referer = $request->headers->get('referer');
        if (strpos($referer, "http://localhost/broadcast/") !== false) {
            $broadcastId = $this->getBroadcastIdFromReferer($referer);
            return Comment::where('broadcasting_rooms_id', $broadcastId)->get();
        }
    }
    
    public function insertComment($request)
    {
        $requestBody = file_get_contents('php://input');
        $jsonData = json_decode($requestBody, true);
        $commentText = $jsonData['text'];
        $referer = $request->headers->get('referer');
        if (strpos($referer, "http://localhost/broadcast/") !== false) {
            $broadcastId = $this->getBroadcastIdFromReferer($referer);
            return $this->saveComment((int)$broadcastId, $commentText);
        }
    }

    private function getBroadcastIdFromReferer($referer)
    {
        if (strpos($referer, "http://localhost/broadcast/stream") !== false) {
            $pattern = "http://localhost/broadcast/stream/";
        } else {
            $pattern = "http://localhost/broadcast/";
        }
        return str_replace($pattern, "", $referer);
    }
    
    private function saveComment($broadcastId, $commentText)
    {
        $comment = new Comment();
        $comment->broadcasting_rooms_id = $broadcastId;
        $comment->comment = $commentText;
        $comment->save();
        return $comment;
    }        
}
