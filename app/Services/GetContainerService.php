<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
Class GetContainerService {
    public function getContainerId($broadcastingRoomId) {
        $containerId = Redis::get($broadcastingRoomId);
        return $containerId;
    }
}
