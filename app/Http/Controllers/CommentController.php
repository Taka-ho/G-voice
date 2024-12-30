<?php

namespace App\Http\Controllers;

use App\Events\SentComment;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
class CommentController extends Controller
{
    public function index(Request $request)
    {
        $comments = Comment::all();
        event(new SentComment($comments));
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'text' => 'required',
        ]);
        $commentModel = new Comment();
        $comment = $commentModel->insertComment($request);
        event(new SentComment($comment));
        return response()->json();
    }
}
