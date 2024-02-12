<?php

namespace App\Http\Controllers;

use App\Events\SentComment;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
class CommentController extends Controller
{
    public function index()
    {
        $comments = Comment::all();
        Event::dispatch(new SentComment($comments));
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'text' => 'required',
        ]);
        $commentModel = new Comment;
        $returnValueOfComment = $commentModel->insertComment($request);
        event(new SentComment($returnValueOfComment));
        return response()->json();
    }
}
