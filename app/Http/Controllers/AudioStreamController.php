<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Pusher\Pusher;

class AudioStreamController extends Controller
{
    public function streamAudio(Request $request)
    {
        // Validate incoming audio data
        $validator = Validator::make($request->all(), [
            'audio_data' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Invalid audio data'], 400);
        }

        // Push audio data to Pusher channel
        $pusher = new Pusher(
            config('broadcasting.connections.pusher.key'),
            config('broadcasting.connections.pusher.secret'),
            config('broadcasting.connections.pusher.app_id'),
            config('broadcasting.connections.pusher.options')
        );

        $pusher->trigger('audio-channel', 'audio-stream', ['audio_data' => $request->audio_data]);

        return response()->json(['message' => 'Audio streamed successfully'], 200);
    }
}
