/**
 * アプリ時間ユーティリティ
 *
 * 全ての時間判断はこのモジュールを通す。
 * 開発者モードの「タイムスキップ」は localStorage に保存され、
 * ページリフレッシュ後も維持される。
 *
 * 日記周期: 毎日 6:00 AM 〜 翌日 6:00 AM を1周期とする。
 */

const STORAGE_KEY = "yozora_debugDayOffset";
const RESET_HOUR = 6; // 日記リセット時刻（6:00 AM）

// --- Debug Day Offset（localStorage 永続化） ---

export function getDebugDayOffset() {
    try {
        const val = localStorage.getItem(STORAGE_KEY);
        return val ? parseInt(val, 10) || 0 : 0;
    } catch {
        return 0;
    }
}

export function setDebugDayOffset(days) {
    try {
        localStorage.setItem(STORAGE_KEY, String(days));
    } catch {
        // localStorage が使えない環境では無視
    }
}

// --- アプリ現在時刻（offset 適用済み） ---

export function getAppNow() {
    const now = new Date();
    const offset = getDebugDayOffset();
    if (offset !== 0) {
        now.setDate(now.getDate() + offset);
    }
    return now;
}

// --- 日記周期の計算 ---

/**
 * 与えられた日時が属する「日記周期」の開始時刻を返す。
 * 6:00 AM 以前 → 前日の 6:00 AM が周期開始
 * 6:00 AM 以降 → 当日の 6:00 AM が周期開始
 *
 * @param {Date} date
 * @returns {Date} 周期の開始時刻
 */
export function getDiaryCycleStart(date) {
    const d = new Date(date);
    if (d.getHours() < RESET_HOUR) {
        // 6AM以前 → 前日の周期
        d.setDate(d.getDate() - 1);
    }
    d.setHours(RESET_HOUR, 0, 0, 0);
    return d;
}

/**
 * 現在の周期の終了時刻（= 次の 6:00 AM）を返す。
 *
 * @param {Date} date
 * @returns {Date} 周期の終了時刻
 */
export function getDiaryCycleEnd(date) {
    const start = getDiaryCycleStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return end;
}

// --- 冷却判定 ---

/**
 * 最後の星の created_at と現在のアプリ時間を比較して、冷却中かどうかを判定。
 *
 * @param {Array} stars - useStarStore の stars 配列
 * @returns {boolean} true = 冷却中（書けない）
 */
export function isCooldownActive(stars) {
    if (!stars || stars.length === 0) return false;

    const now = getAppNow();

    // 現在のアプリ時間より「前」に作られた星のみを対象にする
    const pastStars = stars.filter(s => new Date(s.created_at) <= now);
    if (pastStars.length === 0) return false;

    // 過去の星の中で最新のものを取得
    const latestStar = pastStars.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
    );

    const currentCycleStart = getDiaryCycleStart(now);
    const starDate = new Date(latestStar.created_at);

    // 最新の星が現在の周期内にある → 冷却中
    return starDate >= currentCycleStart;
}

/**
 * 次の 6:00 AM までの残りミリ秒を返す。
 *
 * @returns {number} 残りミリ秒
 */
export function getCooldownRemaining() {
    const now = getAppNow();
    const cycleEnd = getDiaryCycleEnd(now);
    return Math.max(0, cycleEnd.getTime() - now.getTime());
}

/**
 * 冷却進捗を 0〜1 で返す（0 = 書いた直後、1 = 冷却完了間近）。
 *
 * @param {Array} stars
 * @returns {number} 0〜1
 */
export function getCooldownProgress(stars) {
    if (!stars || stars.length === 0) return 1;

    const now = getAppNow();

    // 現在のアプリ時間より「前」に作られた星のみを対象にする
    const pastStars = stars.filter(s => new Date(s.created_at) <= now);
    if (pastStars.length === 0) return 1;

    // 過去の星の中で最新のものを取得
    const latestStar = pastStars.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
    );

    const currentCycleStart = getDiaryCycleStart(now);
    const starDate = new Date(latestStar.created_at);

    if (starDate < currentCycleStart) return 1; // 冷却完了

    const cycleEnd = getDiaryCycleEnd(now);
    const totalMs = cycleEnd.getTime() - currentCycleStart.getTime();
    const elapsedMs = now.getTime() - currentCycleStart.getTime();

    return Math.min(1, Math.max(0, elapsedMs / totalMs));
}

/**
 * 残り時間を "HH:MM" フォーマットで返す。
 *
 * @returns {string}
 */
export function getCooldownTimeString() {
    const remaining = getCooldownRemaining();
    const totalMinutes = Math.ceil(remaining / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
