<?php

namespace App\Events;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class FileChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $filePath;
    public $eventType;

    public function __construct($filePath, $eventType)
    {
        $this->filePath = $filePath;
        $this->eventType = $eventType;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('tree-changes');
    }
}
