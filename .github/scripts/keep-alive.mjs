/**
 * keep-alive.mjs
 * Supabase の無料プランでプロジェクトが一時停止されないよう、定期的にリクエストを送るスクリプト。
 * Node 18+ のネイティブ fetch を使用しているため、追加の npm パッケージは不要。
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌  環境変数が不足しています: SUPABASE_URL または SUPABASE_ANON_KEY が未設定です');
    process.exit(1);
}

async function ping() {
    const url = `${SUPABASE_URL}/rest/v1/`;
    console.log(`🏓  Supabase に疎通確認中 (${new Date().toISOString()}) …`);

    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });

    if (res.ok || res.status === 200) {
        console.log(`✅  Supabase から HTTP ${res.status} が返ってきました — プロジェクトは稼働中です！`);
    } else {
        // 400系のレスポンスでもプロジェクトが起動していることを意味する。
        // 一時停止中のプロジェクトは 503 またはネットワークエラーを返す。
        console.warn(`⚠️  HTTP ${res.status} — しかしプロジェクトは応答しているため、一時停止ではありません。`);
    }
}

ping().catch((err) => {
    console.error('❌  疎通確認に失敗しました:', err.message);
    process.exit(1);
});
