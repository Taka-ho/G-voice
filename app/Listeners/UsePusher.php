<?php

namespace App\Listeners;

use App\Events\AppEventsSentComment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UsePusher
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(AppEventsSentComment $event): void
    {
        //
    }
}
