<?php
namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
class Comment extends Model
{
    use HasFactory;
    protected $table = 'broadcasting_rooms_comments';
    protected $fillable = ['comment'];

    public function insertComment($request) : string
    {
        $comment = $request->text;
    
        // Eloquentのcreateメソッドを使用してレコードを作成
        Comment::create([
            'comment' => $comment,
        ]);
        return $comment;
    }
    
}
