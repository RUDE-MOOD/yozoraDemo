// Supabase Runtime APIの型定義をセットアップ

/* このファイルが更新されるたびに:

  1.再デプロイが必要（supabaseに投げるため） 
  npx supabase functions deploy analyze-diary
  
  2. ターミナルで以下のコマンドを入力してテスト
  node test-api.js
*/

/* 
  【注意】VSCode上の赤線エラーについて
  
  以下のコードで赤線（エラー）が表示されることがありますが、これは正常な動作でありバグではありません。
  
  原因：
  1. `npm:` プレフィックス付きのインポートは Deno 特有の構文であり、VSCode の標準 TypeScript はこれを認識できません。
  2. `Deno` グローバルオブジェクトも同様に、標準環境には存在しないためエラーと表示されます。
  
  Supabase Edge Functions は Deno ランタイムで実行されるため、デプロイ後は問題なく動作します。
  赤線は無視して構いません。
*/

import "@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0"

console.log("Gemini Mood Analyzer Function started!")

// フロントエンドリクエスト用のCORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ムード値に基づいて感情を判定（5つの指標を使用）
function determineEmotion(moodValues: { 
  comfort: number; 
  intensity: number; 
  connection: number;
  control: number;
  energy: number;
}): string {
  const { comfort, intensity, connection, control, energy } = moodValues

  // 感情の判定ロジック
  // comfort: 心地よさ (0=つらい, 100=心地よい)
  // intensity: 感情の強さ (0=無感情, 100=抑えきれない)
  // connection: つながり (0=孤独, 100=つながっている)
  // control: コントロール (0=混乱, 100=冷静)
  // energy: エネルギー (0=疲労, 100=活力)

  // 低エネルギー + 低コントロール = 疲弊状態
  if (energy < 30 && control < 30) {
    return '疲弊'
  }

  // 低強度 + 高コントロール = 平穏
  if (intensity < 30 && control >= 50) {
    return '平穏'
  }

  // 高comfort + 高connection = 愛
  if (comfort >= 70 && connection >= 70) {
    return '愛'
  }

  // 高comfort + 高energy = 興奮
  if (comfort >= 70 && energy >= 70 && intensity >= 50) {
    return '興奮'
  }

  // 高comfort = 喜び
  if (comfort >= 70) {
    return '喜び'
  }

  // 低comfort + 低connection = 悲しみ
  if (comfort <= 30 && connection <= 30) {
    return '悲しみ'
  }

  // 低comfort + 高intensity + 低control = 怒り
  if (comfort <= 30 && intensity >= 70 && control <= 40) {
    return '怒り'
  }

  // 低comfort + 低control = 不安
  if (comfort <= 30 && control <= 40) {
    return '不安'
  }

  // 低comfort = 不安（デフォルト）
  if (comfort <= 30) {
    return '不安'
  }

  // 中間的な状態
  if (connection >= 60) {
    return '愛'
  }

  if (energy >= 60) {
    return '活力'
  }

  return '平穏'
}

Deno.serve(async (req) => {
  // CORSプリフライトリクエストを処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 環境変数からGemini APIキーを取得
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    // 2. リクエストボディを解析
    const { moodValues } = await req.json()
    if (!moodValues || typeof moodValues !== 'object') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'moodValues is required and must be an object with comfort, intensity, connection, control, energy'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { comfort, intensity, connection, control, energy } = moodValues
    console.log(`Analyzing mood: comfort=${comfort}, intensity=${intensity}, connection=${connection}, control=${control}, energy=${energy}`)

    // 感情を判定
    const emotion = determineEmotion(moodValues)

    // 3. Gemini AIを初期化
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // 4. フィードバック生成プロンプトを作成
    const prompt = `あなたは優しく共感的なカウンセラーです。ユーザーが今日の気持ちを5つのスライダーで記録しました。

【今日の気持ち】
- 心地よさ: ${comfort}/100 (0=とてもつらい、100=とても心地いい)
- 感情の強さ: ${intensity}/100 (0=無感情、100=抑えきれない)
- つながり: ${connection}/100 (0=孤独、100=つながっている)
- コントロール: ${control}/100 (0=混乱、100=冷静)
- エネルギー: ${energy}/100 (0=疲労、100=活力)

判定された感情: ${emotion}

この気持ちの状態に対して、温かく共感的なフィードバックメッセージを1-2文で生成してください。
ユーザーの気持ちを受け止め、前向きな言葉をかけてください。

回答は以下のJSON形式のみで返してください（他の説明は不要です）：
{
  "feedback": "フィードバックメッセージ"
}`

    // 5. Gemini APIを呼び出し
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log(`Gemini response: ${text}`)

    // 6. JSONレスポンスを解析
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysisResult = JSON.parse(cleanedText)

    if (!analysisResult.feedback || typeof analysisResult.feedback !== 'string') {
      throw new Error('Invalid feedback value')
    }

    // 7. 成功レスポンスを返す
    return new Response(
      JSON.stringify({
        success: true,
        emotion: emotion,
        feedback: analysisResult.feedback,
        moodValues: moodValues
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in analyze-diary function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

