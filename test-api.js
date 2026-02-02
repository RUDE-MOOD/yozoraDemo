import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルを読み込む
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const BASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_URL = `${BASE_URL}/functions/v1/analyze-diary`;

if (!BASE_URL || !ANON_KEY) {
    console.error("❌ エラー: .envファイルから環境変数を読み込めませんでした。");
    process.exit(1);
}

async function testAnalyze() {
    console.log("🚀 テスト開始...");

    const diaryText = "今日はとても楽しかった！最高の1日だった。";
    console.log(`📤 送信テキスト: ${diaryText}`);

    try {
        const response = await fetch(SUPABASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({ diaryText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("\n✅ 分析結果:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("\n❌ エラーが発生しました:", error);
    }
}

testAnalyze();
