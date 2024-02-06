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

    public function insertComment($request) 
    {
        $comment = $request->text;
        
        // id カラムは自動インクリメントされるため指定不要
        DB::insert("INSERT INTO broadcasting_rooms_comments (comment) VALUES (?)", [
            'comment' => $comment
        ]);
    }
}
