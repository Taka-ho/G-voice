<?php

namespace App\Http\Controllers;

use App\Events\SentComment;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function index()
    {
        $comments = Comment::all();
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'body' => 'required',
        ]);

        $newComment = SentComment::create([
            'body' => $request->input('body'),
            // 他の必要なコメントの属性を追加
        ]);
        Log::debug($newComment);
        // 新しいコメントができたらイベントを発火
        event(new SentComment($newComment));

        return response()->json($newComment);
    }
}
