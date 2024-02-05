<?php
// app/Http/Controllers/CommentController.php

namespace App\Http\Controllers;

use App\Events\CommentSent;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;
class CommentController extends Controller
{
    public function index()
    {
        $comments = Comment::latest()->get();
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'body' => 'required',
        ]);

        $newComment = Comment::create([
            'body' => $request->input('body'),
            // 他の必要なコメントの属性を追加
        ]);
        Log::debug($newComment);
        // 新しいコメントができたらイベントを発火
        event(new CommentSent($newComment));

        return response()->json($newComment);
    }
}
