import Redis from "ioredis";

// Redisに接続するための設定
const redis = new Redis({
    host: 'redis', // Docker Composeのサービス名
    port: 6379,    // Redisのデフォルトポート
});

const deadlineOfCacheObject: number = 6000; // 有効期限（秒）

/**
 * キャッシュするデータの単一エントリーの型定義
 */
interface CacheEntry {
    containerId: string;
    treeData: any; // treeDataの具体的な構造が分かればより厳密な型を定義
    fileAndContents: { [key: string]: { id: number; name: string; content: string; path: string; } }; // fileAndContentsの具体的な型
    createdAt: string;
    isExpired: 0 | 1; // 0: 未期限切れ, 1: 期限切れ
}

/**
 * Redisに保存するJSONオブジェクト全体の型定義
 */
interface CachedData {
    isExpired: 0 | 1; // 全体のキャッシュが期限切れであるかのフラグ
    data: CacheEntry[]; // キャッシュエントリーの配列
}

/**
 * 現在の日時をフォーマットして取得する関数
 * @returns {string} フォーマットされた日時文字列 (YYYY-MM-DD HH:mm:SS)
 */
const getCurrentFormattedDate = (): string => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * データを構造化する関数
 * @param {string} containerId - 対象のコンテナID
 * @param {any} treeData - ファイルツリーデータ
 * @param {object} fileAndContents - ファイル内容のマップ
 * @returns {CacheEntry} 構造化されたキャッシュエントリー
 */
const structJsonData = (containerId: string, treeData: any, fileAndContents: { [key: string]: { id: number; name: string; content: string; path: string; } }): CacheEntry => {
    const createdAt = getCurrentFormattedDate();
    return {
        containerId: containerId,
        treeData: treeData,
        fileAndContents: fileAndContents,
        createdAt: createdAt,
        isExpired: 0 // 初期値は0（未期限切れ）
    };
};

/**
 * キャッシュエントリーの期限切れフラグを更新する関数
 * @param {CacheEntry[]} dataArray - キャッシュエントリーの配列
 * @returns {boolean} いずれかのフラグが更新された場合はtrue、それ以外はfalse
 */
const updateExpirationFlags = (dataArray: CacheEntry[]): boolean => {
    const now = new Date();
    let flagUpdated = false;

    for (const entry of dataArray) {
        const createdAt = new Date(entry.createdAt);
        // Dateオブジェクト間の差はミリ秒単位で返されるため、秒に変換
        const timeDiffSeconds = (now.getTime() - createdAt.getTime()) / 1000; 

        // deadlineOfCacheObject秒経過した場合はフラグを1に設定
        if (timeDiffSeconds >= deadlineOfCacheObject) {
            if (entry.isExpired === 0) { // すでに1でなければ更新
                entry.isExpired = 1;
                flagUpdated = true;
            }
        }
    }
    return flagUpdated;
};

/**
 * データをRedisにキャッシュする関数
 * @param {string} containerId - 対象のコンテナID
 * @param {any} treeData - ファイルツリーデータ
 * @param {object} fileAndContents - ファイル内容のマップ
 * @returns {Promise<string>} 更新されたキャッシュデータ（JSON文字列）
 */
const cacheData = async (containerId: string, treeData: any, fileAndContents: { [key: string]: { id: number; name: string; content: string; path: string; } }): Promise<string> => {
    // 既存のキャッシュを取得
    const existingDataString = await redis.get("JSONObjectOfUsersCode");
    let existingData: CachedData = { isExpired: 0, data: [] };

    // 既存データがあればパース
    if (existingDataString) {
        try {
            const parsed = JSON.parse(existingDataString);
            // 型ガード: パースしたデータがCachedDataインターフェースに合うか確認
            if (typeof parsed === 'object' && parsed !== null && 'isExpired' in parsed && Array.isArray(parsed.data)) {
                existingData = parsed as CachedData;
            } else {
                console.warn("既存のキャッシュデータ形式が無効です。新しいキャッシュを作成します。");
            }
        } catch (err) {
            console.error("既存のキャッシュデータのパースに失敗しました:", err);
            // パース失敗時も新しいキャッシュを作成
        }
    }

    // 期限切れをチェックし、フラグを更新
    const anyFlagUpdated = updateExpirationFlags(existingData.data);
    
    // 全体のキャッシュが期限切れと判断された場合、クリアして新しい空のキャッシュを作成
    // isExpiredが1の場合、以前の処理で既に期限切れとマークされている可能性があるので、その状態を考慮
    const isOverallExpired = existingData.data.every(entry => entry.isExpired === 1); // 全ての要素が期限切れか
    
    if (isOverallExpired && existingData.data.length > 0) {
        console.log(`[${getCurrentFormattedDate()}] 全てのキャッシュエントリーが期限切れです。キャッシュをクリアします。`);
        await redis.set("JSONObjectOfUsersCode", JSON.stringify({ isExpired: 1, data: [] })); // 全体も期限切れとマーク
        return JSON.stringify({ isExpired: 1, data: [] });
    } else if (anyFlagUpdated) {
        // 個々のエントリーの期限切れフラグが更新された場合、全体も再評価
        existingData.isExpired = existingData.data.every(entry => entry.isExpired === 1) ? 1 : 0;
    }


    // 新しいデータを構造化して追加
    const newData = structJsonData(containerId, treeData, fileAndContents);
    existingData.data.push(newData);

    // JSONデータを文字列に変換し、Redisに保存
    const jsonDataString = JSON.stringify(existingData);
    await redis.set("JSONObjectOfUsersCode", jsonDataString);
    
    console.log(`[${getCurrentFormattedDate()}] キャッシュジョブを実行中...`);
    return jsonDataString; // JSONとして返す
};

// エクスポート
// TypeScriptではデフォルトエクスポートが推奨される
export default { cacheData };
