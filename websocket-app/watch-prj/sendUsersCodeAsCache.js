/* 
クライアントから送られてきたtreeDataとfileAndContentsの値を一定時間キャッシュとして保持する。
保持するのはJSONとして保持。データの構造は
isExpiredはキャッシュのデータが有効期限なのかのフラグを定義している。0の場合は有効期限内。1の場合は有効期限切れである。有効期限が
切れている場合はLaravel側に有効期限切れのデータをPOSTさせる必要がある。
下記が保存するデータの構造である。
{
    "isExpired": 0,
    "data": [
        {
            "containerId": "containerId1",
            "treeData": { "key": "value1" }, 
            "fileAndContents": { "key": "value1" },
            "createdAt": "2024-12-30 11:24:37"
        },
        {
            "containerId": "containerId1",
            "treeData": { "key": "value2" }, 
            "fileAndContents": { "key": "value2" },
            "createdAt": "2024-12-30 11:25:37"
        },
        {
            "containerId": "containerId2",
            "treeData": { "key": "value3" }, 
            "fileAndContents": { "key": "value3" },
            "createdAt": "2024-12-30 11:26:37"
        }
    ]
}

*/

import Redis from "ioredis";

const redis = new Redis();

// データを構造化する関数
const structJsonData = (containerId, treeData, fileAndContents) => {
    const createdAt = getCurrentFormattedDate();
    return {
        containerId: containerId,
        treeData: treeData,
        fileAndContents: fileAndContents,
        createdAt: createdAt,
        isExpired: 0 // 初期値は0（未期限切れ）
    };
};

// データをキャッシュに保存する例
const cacheData = async (containerId, treeData, fileAndContents) => {
    // 既存のキャッシュを取得
    const existingDataString = await redis.get("JSONObjectOfUsersCode");
    let existingData = { isExpired: 0, data: [] }; // 初期データ構造

    // 既存のデータが存在する場合はデコード
    if (existingDataString) {
        existingData = JSON.parse(existingDataString);
    }

    // 新しいデータを構造化
    const newData = structJsonData(containerId, treeData, fileAndContents);

    // データ配列に新しいデータを追加
    existingData.data.push(newData);

    // JSONデータを文字列に変換
    const jsonDataString = JSON.stringify(existingData);

    // フラグを更新する
    const isExpired = await updateExpirationFlags(existingData.data);
    if (!isExpired) {
        // Redisにキャッシュとして保存
        await redis.set("JSONObjectOfUsersCode", jsonDataString);
        return existingData; // 変更: 保存後のデータを返す
    } else {
        await redis.set("JSONObjectOfUsersCode", JSON.stringify({ isExpired: 0, data: [] }));
        return null; // 変更: 期限切れの場合はnullを返す
    }
};
