<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TreeChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $treeData;
    public $containerId;
    public $fileAndContents;
    public $pathBeforeChange;
    public $pathAfterChange;

    public function __construct($treeData, $containerId, $fileAndContents, $pathBeforeChange, $pathAfterChange)
    {
        $this->treeData = $treeData;
        $this->containerId = $containerId;
        $this->fileAndContents = $fileAndContents;
        $this->pathBeforeChange = $pathBeforeChange;
        $this->pathAfterChange = $pathAfterChange;
    }

    public function broadcastOn()
    {
        return new Channel('file-tree-channel.' . $this->containerId);
    }
}
