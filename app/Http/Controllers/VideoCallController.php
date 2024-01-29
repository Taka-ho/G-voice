<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VideoCallController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth'); // 要ログインにする
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $other_users = User::select('id', 'name')
            ->where('id', '!=', $user->id)
            ->get(); // 自分以外のユーザーを取得

        return Inertia::render('VideoCall/Index', [
            'user' => $user->only('id', 'name'),
            'otherUsers' => $other_users,
        ]);
    }
}
