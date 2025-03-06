import Redis from "ioredis";

// Redisに接続するための設定
const redis = new Redis({
    host: 'redis', // Docker Composeのサービス名
    port: 6379,    // Redisのデフォルトポート
});

const deadlineOfCacheObject = 600; // 有効期限（秒）

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

const cacheData = async (containerId, treeData, fileAndContents) => {
    // 既存のキャッシュを取得
    const existingDataString = await redis.get("JSONObjectOfUsersCode");
    let existingData = { isExpired: 0, data: [] };

    // 既存データがあればパース
    if (existingDataString) {
        existingData = JSON.parse(existingDataString);
    }

    // 期限切れをチェック
    const isExpired = await updateExpirationFlags(existingData.data);
    if (isExpired) {
        // 期限切れの場合はキャッシュをクリア
        await redis.set("JSONObjectOfUsersCode", JSON.stringify({ isExpired: 0, data: [] }));
        return JSON.stringify({ isExpired: 1, data: [] }); // JSONとして返す
    }

    // 新しいデータを構造化して追加
    const newData = structJsonData(containerId, treeData, fileAndContents);
    existingData.data.push(newData);

    // JSONデータを文字列に変換し、Redisに保存
    const jsonDataString = JSON.stringify(existingData);
    await redis.set("JSONObjectOfUsersCode", jsonDataString);
    
    console.log(`[${getCurrentFormattedDate()}] Running batch job...`);
    return JSON.stringify(existingData); // JSONとして返す
};


// フラグを更新する関数
const updateExpirationFlags = async (dataArray) => {
    const now = new Date();

    // 各データのフラグを更新
    let flagUpdated = false;
    for (const entry of dataArray) {
        const createdAt = new Date(entry.createdAt);
        const timeDiff = (now - createdAt) / 1000; // 秒単位の差分

        // deadlineOfCacheObject秒経過した場合はフラグを1に設定
        if (timeDiff >= deadlineOfCacheObject) {
            entry.isExpired = 1;
            flagUpdated = true;
        }
    }

    return flagUpdated;
};

// 日付をフォーマットする関数
const getCurrentFormattedDate = () => {
    const now = new Date();

    const year = now.getFullYear(); // 年を取得
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月を取得
    const day = String(now.getDate()).padStart(2, '0'); // 日を取得
    const hours = String(now.getHours()).padStart(2, '0'); // 時を取得
    const minutes = String(now.getMinutes()).padStart(2, '0'); // 分を取得
    const seconds = String(now.getSeconds()).padStart(2, '0'); // 秒を取得

    // フォーマットされた日付を返す
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// エクスポート
export default { cacheData };
