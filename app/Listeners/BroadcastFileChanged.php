<?php
// app/Listeners/BroadcastFileChanged.php
namespace App\Listeners;

use App\Events\FileChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class BroadcastFileChanged
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  \App\Events\FileChanged  $event
     * @return void
     */
    public function handle(FileChanged $event)
    {
        // イベントをブロードキャストするだけでOK
    }
    public function broadcastOn()
    {
        return new PrivateChannel('file-changes.' . $this->containerId);
    }
}
