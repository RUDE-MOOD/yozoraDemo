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
  emotional: number;    // 情緒的安定性
  motivation: number;   // 動因の充足
  social: number;       // 社会的適応
  physical: number;     // 生体的メカニズム
  fulfillment: number;  // 刺激の受容
}): string {
  const { emotional, motivation, social, physical, fulfillment } = moodValues

  // 全体的な平均スコアを計算
  const avgScore = (emotional + motivation + social + physical + fulfillment) / 5

  // 感情の判定ロジック
  // emotional: 情緒的安定性 (0=つらい・どんより, 100=心地いい・穏やか)
  // motivation: 動因の充足 (0=無気力・不完全燃焼, 100=やりきった・満足)
  // social: 社会的適応 (0=孤独・物足りない, 100=充足感・満タン)
  // physical: 生体的メカニズム (0=ずっしり重たい, 100=すっきり軽やか)
  // fulfillment: 刺激の受容 (0=退屈・マンネリ, 100=新鮮・充実していた)

  // 全体的に高い = 充実・幸福
  if (avgScore >= 70) {
    if (fulfillment >= 80) {
      return '充実'
    }
    if (social >= 80) {
      return '幸福'
    }
    return '満足'
  }

  // 情緒が安定 + 体が軽い = 穏やか
  if (emotional >= 60 && physical >= 60) {
    return '穏やか'
  }

  // 動因が高い + 充実感が高い = 達成感
  if (motivation >= 70 && fulfillment >= 70) {
    return '達成感'
  }

  // 社会的充足が高い = つながり
  if (social >= 70) {
    return 'つながり'
  }

  // 全体的に低い = 疲労・消耗
  if (avgScore <= 30) {
    if (physical <= 20) {
      return '疲労'
    }
    if (emotional <= 20) {
      return '落ち込み'
    }
    return '消耗'
  }

  // 情緒が低い = 不調
  if (emotional <= 30) {
    if (social <= 30) {
      return '孤独'
    }
    return '不調'
  }

  // 体が重い = だるさ
  if (physical <= 30) {
    return 'だるさ'
  }

  // 充実感が低い = 退屈
  if (fulfillment <= 30) {
    return '退屈'
  }

  // 中間的な状態
  return '普通'
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
          error: 'moodValues is required and must be an object with emotional, motivation, social, physical, fulfillment'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { emotional, motivation, social, physical, fulfillment } = moodValues
    console.log(`Analyzing mood: emotional=${emotional}, motivation=${motivation}, social=${social}, physical=${physical}, fulfillment=${fulfillment}`)

    // 感情を判定
    const emotion = determineEmotion(moodValues)

    // 3. Gemini AIを初期化
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // 4. フィードバック生成プロンプトを作成
    const prompt = `あなたは優しく共感的なカウンセラーです。ユーザーが今日の気持ちを5つのスライダーで記録しました。

【今日の気持ち】
- 情緒的安定性: ${emotional}/100 (0=つらい・どんより、100=心地いい・穏やか)
- 動因の充足: ${motivation}/100 (0=無気力・不完全燃焼、100=やりきった・満足)
- 社会的適応: ${social}/100 (0=孤独・物足りない、100=充足感・満タン)
- 生体的メカニズム: ${physical}/100 (0=ずっしり重たい、100=すっきり軽やか)
- 刺激の受容: ${fulfillment}/100 (0=退屈・マンネリ、100=新鮮・充実していた)

判定された状態: ${emotion}

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
      }),￥’
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

