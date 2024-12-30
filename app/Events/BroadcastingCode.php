<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BroadcastingCode
{
    use Dispatchable, SerializesModels;

    public $user;
    public $code;

    public function __construct(User $user, $code)
    {
        $this->user = $user;
        $this->code = $code;
    }

    public function broadcastOn()
    {
        return new Channel('BroadcastingCode');
    }
}
