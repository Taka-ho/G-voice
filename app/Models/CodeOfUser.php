<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CodeOfUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'broadcasting_id',
        'container_id',
        'tree_data',
        'file_and_contents',
    ];

    public function insertUsersCode($jsonUsersCode)
    {
        // JSONデータをデコード
        $usersCode = json_decode($jsonUsersCode, true);
        // デコードに失敗した場合の処理
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('JSON decode error: ' . json_last_error_msg());
            return;
        }

        if (empty($usersCode['data']) || !is_array($usersCode['data'])) {
            Log::error('Invalid data format: ' . json_encode($usersCode));
            return;
        }

        $data = array_filter($usersCode['data'], 'is_array'); // 配列以外を除外

        foreach ($data as $item) {
            // 各アイテムが配列であることを確認
            if (!is_array($item)) {
                Log::error('Invalid item format: ' . json_encode($item));
                continue; // 不正なアイテムをスキップ
            }

            // containerIdを取得
            if (!isset($item['containerId'])) {
                Log::error('containerId is missing in item: ' . json_encode($item));
                continue; // containerIdがない場合はスキップ
            }

            // containerIdを文字列として取得
            $containerId = strval($item['containerId']);

            // treeDataとfileAndContentsも取得
            // treeDataとfileAndContentsを取得し、文字列として格納
            $treeDataString = json_encode($item['treeData']);
            $fileAndContentsString = json_encode($item['fileAndContents']);
            $createdAt = $item['createdAt']; // ここは文字列としてそのまま取得する

            // container_idを使ってuser_idとbroadcasting_idを取得
            $broadcastingRoom = BroadcastingRoom::where('container_id', $containerId)->first();

            if ($broadcastingRoom) {
                try {
                    DB::beginTransaction();

                    DB::table('code_of_users')->insert([
                        'user_id' => $broadcastingRoom->user_id,
                        'broadcasting_id' => $broadcastingRoom->id,
                        'container_id' => $containerId,
                        'tree_data' => $treeDataString,
                        'file_and_contents' => $fileAndContentsString,
                        'created_at' => $createdAt,
                    ]);

                    DB::commit();
                    Log::debug("Data inserted successfully.");
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error("DB挿入エラー: " . $e->getMessage());
                }
            } else {
                Log::warning("Container ID {$containerId} が見つかりませんでした。");
            }
        }
    }    
}
