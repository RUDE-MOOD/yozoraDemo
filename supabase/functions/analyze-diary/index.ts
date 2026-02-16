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

// =============================================
// 三軸感情分析システム
// =============================================
// Q1: 気分軸（emotional）     - 直感的な良い/悪い
// Q2: 自己充足軸の一部（motivation） - 自己満足・充足感
// Q3: エネルギー軸の一部（social）   - 身体・心理の元気度
// Q4: エネルギー軸の一部（physical） - 身体・心理の元気度
// Q5: 自己充足軸の一部（fulfillment）- 自己満足・充足感
// =============================================

// 軸レベルの型定義
type AxisLevel = '高' | '中' | '低'

// 三軸の計算結果
interface ThreeAxisResult {
  kibun: number        // 気分軸（Q1そのまま）
  energy: number       // エネルギー軸（(Q3+Q4)/2）
  jiko: number         // 自己充足軸（(Q2+Q5)/2）
  kibunLevel: AxisLevel
  energyLevel: AxisLevel
  jikoLevel: AxisLevel
  totalScore: number   // 総合スコア
}

// 値からレベルへの変換（0-33:低、34-66:中、67-100:高）
function toLevel(value: number): AxisLevel {
  if (value <= 33) return '低'
  if (value <= 66) return '中'
  return '高'
}

// 三軸の計算
function calculateThreeAxes(moodValues: {
  emotional: number
  motivation: number
  social: number
  physical: number
  fulfillment: number
}): ThreeAxisResult {
  const { emotional, motivation, social, physical, fulfillment } = moodValues

  // 各軸の計算
  const kibun = emotional                          // Q1
  const energy = (social + physical) / 2            // (Q3+Q4)/2
  const jiko = (motivation + fulfillment) / 2       // (Q2+Q5)/2

  // 総合スコア = Q1×0.30 + Q2×0.25 + Q3×0.20 + Q4×0.10 + Q5×0.15
  const totalScore = emotional * 0.30 + motivation * 0.25 + social * 0.20 + physical * 0.10 + fulfillment * 0.15

  return {
    kibun,
    energy,
    jiko,
    kibunLevel: toLevel(kibun),
    energyLevel: toLevel(energy),
    jikoLevel: toLevel(jiko),
    totalScore: Math.round(totalScore * 10) / 10,
  }
}

// 全27パターンの感情タイプ分類テーブル
// キー: "気分_エネルギー_自己充足" (例: "高_高_高")
const EMOTION_TYPE_MAP: Record<string, string> = {
  // 気分:高
  '高_高_高': 'うれしい・充実・幸福',
  '高_高_中': '満足・安定',
  '高_高_低': '元気だが物足りない',
  '高_中_高': '穏やか・安心',
  '高_中_中': 'まずまず・平穏',
  '高_中_低': '気分は良いが空虚',
  '高_低_高': 'リラックス・静穏',
  '高_低_中': 'のんびり・ゆったり',
  '高_低_低': '気分は良いが無気力',

  // 気分:中
  '中_高_高': 'やる気はあるが不安定',
  '中_高_中': '活動的だが迷い',
  '中_高_低': '空回り・焦り',
  '中_中_高': '静かな充足',
  '中_中_中': '普通・平穏',
  '中_中_低': 'なんとなく不満',
  '中_低_高': '疲れているが満足',
  '中_低_中': '無気力・ぼんやり',
  '中_低_低': '停滞・モヤモヤ',

  // 気分:低
  '低_高_高': 'イライラ・怒り',
  '低_高_中': '焦燥・不満',
  '低_高_低': '苛立ち・暴走',
  '低_中_高': '切なさ・寂しさ',
  '低_中_中': '落ち込み・悲しみ',
  '低_中_低': '憂鬱・自己嫌悪',
  '低_低_高': '燃え尽き・喪失感',
  '低_低_中': '疲弊・無力感',
  '低_低_低': '消耗・虚無',
}

// 三軸から感情タイプを判定
function determineEmotion(moodValues: {
  emotional: number
  motivation: number
  social: number
  physical: number
  fulfillment: number
}): { emotion: string; axes: ThreeAxisResult } {
  const axes = calculateThreeAxes(moodValues)
  const key = `${axes.kibunLevel}_${axes.energyLevel}_${axes.jikoLevel}`
  const emotion = EMOTION_TYPE_MAP[key] || '普通・平穏'
  return { emotion, axes }
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
    const body = await req.json()
    const { moodValues, goodThings } = body || {}
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
    const goodThingsList = goodThings
      ? [goodThings.goodThing1, goodThings.goodThing2, goodThings.goodThing3]
        .filter((s): s is string => !!s && typeof s === 'string')
        .map((s) => s.trim())
        .filter(Boolean)
      : []
    console.log(`Analyzing mood: emotional=${emotional}, motivation=${motivation}, social=${social}, physical=${physical}, fulfillment=${fulfillment}, goodThings=${goodThingsList.length}`)

    // 三軸感情分析
    const { emotion, axes } = determineEmotion(moodValues)
    console.log(`Three-axis analysis: kibun=${axes.kibunLevel}(${axes.kibun}), energy=${axes.energyLevel}(${axes.energy}), jiko=${axes.jikoLevel}(${axes.jiko}), totalScore=${axes.totalScore}, emotion=${emotion}`)

    // 3. Gemini AIを初期化
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // 4. フィードバック生成プロンプトを作成（三軸原理＋総合スコアベース）
    const goodThingsSection = goodThingsList.length > 0
      ? `\n【今日のいいこと】\n${goodThingsList.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      : ''
    const prompt = `あなたは宇宙の星のように優しく見守る存在です。ユーザーが今日の気持ちを5つのスライダーで記録しました。

【三軸感情分析システム】
このシステムでは、5つのスライダー値を3つの軸に集約して感情を判定しています。

■ 三軸の定義:
1. 気分軸（直感的な良い/悪い）: ${axes.kibun}/100 → ${axes.kibunLevel}
2. エネルギー軸（身体・心理の元気度）: ${axes.energy}/100 → ${axes.energyLevel}
3. 自己充足軸（自己満足・充足感）: ${axes.jiko}/100 → ${axes.jikoLevel}

■ 各軸の区間: 低(0〜33) / 中(34〜66) / 高(67〜100)

■ 総合スコア: ${axes.totalScore}/100
（計算式: Q1×0.30 + Q2×0.25 + Q3×0.20 + Q4×0.10 + Q5×0.15）

■ 判定された感情タイプ: ${emotion}

【元データ（5つのスライダー値）】
- Q1 気分（今の気持ちは心地いい？）: ${emotional}/100
- Q2 自分らしさ（今日は自分らしく過ごせた？）: ${motivation}/100
- Q3 心の満たされ方: ${social}/100
- Q4 体の状態: ${physical}/100
- Q5 充実感: ${fulfillment}/100
${goodThingsSection}
上記の三軸分析結果と総合スコアを参考にして、この感情タイプ「${emotion}」にふさわしい「星からの手紙」として、温かく共感的なメッセージを1-2文で生成してください。
${goodThingsList.length > 0 ? '今日のいいことに触れつつ、' : ''}ユーザーの気持ちをそのまま受け止め、前向きになれる言葉をかけてください。夜空の星が語りかけるような優しいトーンで。

注意事項:
- 総合スコアが低い場合は無理にポジティブにせず、寄り添うメッセージにしてください
- 三軸のバランス（例: 気分は良いがエネルギーが低いなど）を考慮してメッセージを作成してください
- 感情タイプの名称をそのまま文中に使わないでください

回答は以下のJSON形式のみで返してください（他の説明やマークダウンは不要です）：
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

    // 7. 成功レスポンスを返す（三軸情報と総合スコアを含む）
    return new Response(
      JSON.stringify({
        success: true,
        emotion: emotion,
        feedback: analysisResult.feedback,
        moodValues: moodValues,
        totalScore: axes.totalScore,
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
