/**
 * Gemini APIが失敗した際のフォールバック分析
 * mood_values と goodThings から感情と星からの手紙を生成する
 */

/**
 * ムード値から感情を判定（analyze-diaryのdetermineEmotionと同様のロジック）
 */
function determineEmotion(moodValues) {
  const { emotional, motivation, social, physical, fulfillment } = moodValues;
  const avgScore = (emotional + motivation + social + physical + fulfillment) / 5;

  if (avgScore >= 70) {
    if (fulfillment >= 80) return '充実';
    if (social >= 80) return '幸福';
    return '満足';
  }
  if (emotional >= 60 && physical >= 60) return '穏やか';
  if (motivation >= 70 && fulfillment >= 70) return '達成感';
  if (social >= 70) return 'つながり';
  if (avgScore <= 30) {
    if (physical <= 20) return '疲労';
    if (emotional <= 20) return '落ち込み';
    return '消耗';
  }
  if (emotional <= 30) {
    if (social <= 30) return '孤独';
    return '不調';
  }
  if (physical <= 30) return 'だるさ';
  if (fulfillment <= 30) return '退屈';
  return '普通';
}

/**
 * 感情に応じた星からの手紙のフォールバックメッセージ
 */
const FALLBACK_MESSAGES = {
  充実: '今日はとても充実した一日でしたね。その調子で、明日もいい一日になりますように。',
  幸福: '心が満たされている様子が伝わってきます。そんな気持ちを大切に過ごしてくださいね。',
  満足: 'よく頑張った一日でしたね。ゆっくり休んで、明日に備えてください。',
  穏やか: '穏やかな気持ちで過ごせているのは素敵です。そのままのペースで大丈夫ですよ。',
  達成感: 'やりきった感、とっても良いですね。自分の力を信じて、また明日も前を向いて歩きましょう。',
  つながり: '人とのつながりを感じられる一日だったんですね。その温かさを忘れずに。',
  疲労: 'お疲れさまです。無理せず、今日はゆっくり休んでくださいね。',
  落ち込み: '少し辛い気持ちなのかもしれません。大丈夫、いつか必ず前に進めます。今日はゆっくり過ごしてください。',
  消耗: 'お疲れが出ているようです。休むことも大切なこと。無理しないでくださいね。',
  孤独: '一人の時間も大切ですが、誰かと話すと楽になるかもしれません。あなたのことを思っている人はきっといます。',
  不調: '体調や気持ちに波があるときもあります。無理せず、自分のペースで過ごしてください。',
  だるさ: '体が重いときは、無理をせず休息を。小さなことでも自分を労わってあげてください。',
  退屈: 'マンネリを感じるときもあります。小さな変化を探してみるのもおすすめです。',
  普通: '特別な日でなくても、今日一日を過ごせたこと自体が素敵なこと。お疲れさまでした。',
};

/**
 * 今日のいいことのテキストを組み立て
 */
function formatGoodThingsText(goodThings) {
  if (!goodThings) return '';
  const list = [goodThings.goodThing1, goodThings.goodThing2, goodThings.goodThing3]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean);
  return list.length > 0 ? list.join('、') : '';
}

/**
 * mood_values と goodThings からフォールバックの分析結果を生成
 * @param {Object} moodValues
 * @param {Object} [goodThings] - { goodThing1, goodThing2, goodThing3 }
 * @returns {{ success: boolean, emotion: string, feedback: string, moodValues: Object }}
 */
export function getFallbackAnalysis(moodValues, goodThings = null) {
  const emotion = determineEmotion(moodValues);
  const baseFeedback = FALLBACK_MESSAGES[emotion] || FALLBACK_MESSAGES.普通;
  const goodThingsText = formatGoodThingsText(goodThings);
  const feedback = goodThingsText
    ? `「${goodThingsText}」いいですね。${baseFeedback}`
    : baseFeedback;
  return {
    success: true,
    emotion,
    feedback,
    moodValues,
  };
}
