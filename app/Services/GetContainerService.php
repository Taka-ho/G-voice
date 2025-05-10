<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
Class GetContainerService {
    public function ReturnContainerId($broadcastingRoomId) {
        $cacheData = $this->GetContainerId($broadcastingRoomId);
        Log::debug($cacheData['containerId']);
    }

    private function GetContainerId($broadcastingRoomId)
    {
        $key = "broadcast:{$broadcastingRoomId}";

        // Predisを使ってハッシュを取得
        $client = new Predis\Client();
        $value = $client->hgetall($key);

        // 取得した値が空でないか確認
        if (!empty($value)) {
            return [
                'containerId' => $value['container_id'],
                'broadcastingRoomId' => $value['broadcasting_room_id'],
            ];
        }

        // 値が存在しない場合はnullを返す
        return null;
    }

}
