<?php

namespace App\Listeners;

use App\Events\SentComment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UsePusher
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
        Log::debug('UsePusher listener has been constructed');
    }

    /**
     * Handle the event.
     */
    public function handle(SentComment $event): void
    {
        // ブロードキャストする処理をここに記述
        // 例：新しいコメントを全ユーザーに送信するなど
        Log::debug(json_encode($event));
    }
}
