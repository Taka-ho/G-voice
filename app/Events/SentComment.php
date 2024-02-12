<?php
namespace App\Events;
use App\Models\Comment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Listeners\UsePusher;
class SentComment implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The new comment.
     *
     * @var \App\Models\Comment
     */
    public $comment;

    /**
     * Create a new event instance.
     *
     * @param \App\Models\Comment $comment
     */

     public function __construct(string $comment)
    {
        $this->comment = $comment;
    }

    public function broadcastWith()
    {
        return ['comment' => $this->comment];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('comment')];
        
    }
}
