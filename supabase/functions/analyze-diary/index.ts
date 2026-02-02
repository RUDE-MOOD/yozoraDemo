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

console.log("Gemini Diary Analyzer Function started!")

// フロントエンドリクエスト用のCORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { diaryText } = await req.json()
    if (!diaryText || typeof diaryText !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'diaryText is required and must be a string'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Analyzing diary: "${diaryText.substring(0, 50)}..."`)

    // 3. Gemini AIを初期化
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // 4. 感情分析プロンプトを作成
    const prompt = `あなたは優しく共感的なカウンセラーです。以下の日記を読んで、感情を正確に分析し、ユーザーを励ましてください。

日記テキスト: "${diaryText}"

【感情の定義】
- 喜び：楽しい、嬉しい、幸せ、満足などのポジティブな感情
- 悲しみ：悲しい、寂しい、落ち込んでいる、失望などのネガティブな感情
- 怒り：腹が立つ、イライラする、不満などの怒りの感情
- 不安：心配、恐れ、緊張、不安などの感情
- 愛：愛情、感謝、温かさ、親しみなどの感情
- 興奮：ワクワク、ドキドキ、高揚感などの感情
- 平穏：穏やか、リラックス、落ち着いているなどの感情

以下のJSON形式で回答してください（他の説明は一切不要です）：
{
  "emotion": "喜び" または "悲しみ" または "怒り" または "不安" または "愛" または "興奮" または "平穏",
  "feedback": "ユーザーへの温かく励ましのメッセージ（1-2文で簡潔に）"
}

重要：
- 日記の内容を注意深く読み、本当に表現されている感情を選んでください
- 「楽しい」「嬉しい」などの言葉があれば「喜び」を選んでください
- feedbackは必ず肯定的で、ユーザーの気持ちに寄り添い、前向きな言葉をかけてください`

    // 5. Gemini APIを呼び出し
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log(`Gemini response: ${text}`)

    // 6. JSONレスポンスを解析
    // マークダウンコードブロックがあれば削除
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysisResult = JSON.parse(cleanedText)

    // 7. レスポンスを検証
    const validEmotions = ['喜び', '悲しみ', '怒り', '不安', '愛', '興奮', '平穏']
    if (!analysisResult.emotion || !validEmotions.includes(analysisResult.emotion)) {
      throw new Error('Invalid emotion value')
    }
    if (!analysisResult.feedback || typeof analysisResult.feedback !== 'string') {
      throw new Error('Invalid feedback value')
    }

    // 8. 成功レスポンスを返す
    return new Response(
      JSON.stringify({
        success: true,
        emotion: analysisResult.emotion,
        feedback: analysisResult.feedback,
        analyzedText: diaryText
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

