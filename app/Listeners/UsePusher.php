<?php
use App\Events\SentComment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UsePusher implements ShouldQueue
{
    protected $someService;

    /**
     * Create the event listener.
     *
     * @param SomeService $someService
     */
    public function __construct(SomeService $someService)
    {
        $this->someService = $someService;
    }

    /**
     * Handle the event.
     */
    public function handle(SentComment $event): void
    {
        // $this->someService->doSomething();
    }
}
