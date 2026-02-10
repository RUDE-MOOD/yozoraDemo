# ノスタージア WEB3D のデモです

# TODO LIST

### やり直し
- [x] ドーム形を立方体にする
- [x] レイヤーを積み上げること
- [x] ピンチイン・ピンチアウトの修正
- [ ] プロンプトの精度上げ

### BugFix
- [x] 星を作成したら、最上階のレイヤーを超えて画面外に出てしまう
- [ ] カメラ移動時に、「ラグる」という感覚がする

### Advanced機能
- [ ] 星データの管理をclass化する

### 機能系
- [x] meshを作って一つの星を打ち上げる
- [x] dreiライブラリのTextを作って星の情報を画面上に表示する
- [x] UIを追加して、入力欄を追加
- [x] ディレクトリフォルダー構造を整理する(apis,store,pages,utilsなど)
  <details><summary>フォルダー構造</summary>

  ```
  src/
  ├── apis/       # Supabase, Geminiとの通信ロジック
  ├── components/ # Effects, Experience, MyStars, UI などの部品
  ├── store/      # Zustand（星のデータやユーザー情報の管理）
  ├── pages/      # メイン画面以外のページ
  ├── utils/      # 感情スコア計算、request、日付フォーマットなどの関数
  ├── supabase/   # supabase関連（EdgeFunction、GEMINIへのプロンプトをここに書く）
  └── App.jsx     # 全体の統合
  ```
  </details>
- [x] 生成された星をクリックして、詳細情報が表示できるように
- [x] 星のデータをsupabaseに保存し、userStarsステートを更新する
- [x] GEMINIのAPIを導入し、ユーザーが書いた日記の感情を分析できるように
- [ ] 重み付けのアルゴリズムを作る
- [ ] 音声ガイド追加（画面を開く時とか、日記を書き終える時とか、音声ファイルを再生、ローカル保存）
- [x] 日記を書き終えたら、画面が自動的に出来立ての星のポジションへ移動する
- [x] azureVMでデプロイ

### ビジュアル系
- [x] skybox交換機能
- [x] ディフォルトの色合い3パターン出す
- [x] レイヤー3の遠い星を大きくする


## Development Tools

このプロジェクトは **Antigravity + Skills** AI を使用して開発されました。

- **Antigravity**: 高度なエージェント AI によるコーディング支援
- **Skills**: R3F (React Three Fiber) に特化した専門知識モジュール（Geometry, Postprocessing, Shaders など）を活用し、ベストプラクティスに沿った実装を行っています。

# 環境初期化

1. `git clone` またはソースコードをダウンロードする
2. Node.jsをインストールする
3. フォルダーパスのターミナルを開いて `npm install` でライブラリを初期化（学校のネットワークでうまくできない場合はテザリングなど別のネット環境でリトライ）
4. supabase接続用の `.env` ファイルをルートフォルダーに入れる
5. `npm run dev` で実行する

<h2>レイヤー構造</h2>
<h4>プラネタリウム自体が７つのレイヤーでできている。</h4>
<ol>
  <li>背景（宇宙の色）<br>Three.jsのシェーダー。自由に変えられるようにするため画像を使用しない。</li>
  <li>流体層（天の川風）<br>GPUへの負荷の最小限に抑えるため、ノイズシェーダーを使用。UVマップをゆっくりずらすことで動いているように見せる。</li>
  <li>背景の遠い星 <br>ユーザーが操作しないのでノイズマップですませる。</li>
  <li>霧 <br>さらに立体感を出すためのレイヤー。3Dボリュームでやるとすごく重たくなるのでこれもノイズマップで実現する。深度に応じて透明度の変化もできる。</li>
  <li>星（ユーザーが操作できる）<br>3Dで描画する。UserStarコンポーネントで各星を個別に描画し、独自のシェーダーで光り輝く星（光核＋十字フレア）を表現。Billboardで常にカメラを向き、クリックで詳細を表示。</li>
  <li>エフェクト <br>Effectsコンポーネントで実現。</li>
  <li>UI描画 （ユーザーが操作できる）<br>TailwindCSSを用いたHTMLオーバーレイ。グラスモーフィズムデザインで、日記の投稿フォームなどを提供。</li>
</ol>
<p>こういう風にレイヤー毎に分けると、各要素を独立させレイヤー同士の直接依存が生じず拡張性を高めることができる。レイヤー毎の描画トグル・テーマの切り替え・低スペック端末向けのパフォーマンス描画モードも実装可能。</p>

# コンポーネント

## Experience

各コンポーネントを組み立てるためのメインコンテナ。
CameraControls を使用し、ズームや移動の制限（最小・最大距離、パン範囲）を設定済み。
スマホなどのタッチ操作（ピンチズーム）にも対応。

## Effects

`@react-three/postprocessing`を使用した映像効果を担当。

- **Bloom**: 星の輝きを強調し、光暈（ハロー）を追加。
- **Noise**: フィルムライクな粒子感を加え、デジタル的な冷たさを軽減。
- **Vignette**: 画面四隅を減光させ、視線を中央へ誘導しつつ没入感を高める。
- **ToneMapping**: HDR レンダリングの色調を補正（ACESFilmic）し、白飛びを抑えつつコントラストを確保。

## SkyBox

複数の平面レイヤーを重ねた構造（Cuboid 的アプローチ）。
以下の 4 層で深みのある夜空を表現：

1. **Background**: 宇宙のベースカラー
2. **Fluid**: 天の川のような流体ノイズ
3. **Stars**: 瞬く遠景の星々
4. **Fog**: 奥行きを出すための霧
   各レイヤーは専用のシェーダーで描画され、軽量かつ表現豊かに実装。

## SkyBoxの色合いの決め方

1. Layer1 Background の宇宙背景の色を決める
   <br>199~201 行　
   backgroundMaterial colorTop="#000000" colorBottom="#101035"
   <br>
   colorTop は上部の色、colorBottom は下部の色<br>
2. Layer2 Fluid の動いている天の川の色を決める<br>
   216~217 行 <colorA="#101035" colorB="#551a8b" /><br>
   colorA はメインな色、colorB は輝く部分の色<br>
3. Layer3 Stars の背景の遠い星の色を決める<br>
   DistantStars.jsx の color props で変更<br>
4. Layer4 Fog の薄い霧の色を決める<br>
   238 行 <color="#aaaaff" /><br>

## UserStarとUserAddedStars

レイヤー 5 に相当する、ユーザーが日記を書くことで生成される星を描画するコンポーネント。

- **SingleStarMaterial**: 円形の光核と十字のレンズフレア（光条）を持つ独自のシェーダーで描画。Uniformsで個別の色・サイズ・瞬きタイミングを制御。
- **Billboard**: `@react-three/drei`のBillboardを使用し、常にカメラの方を向くように制御。星の下に生成日時のテキストラベルを表示。
- **Interaction**: 星をクリックすると`StarDetailModal`が開き、日記テキスト・感情分析結果・座標などの詳細情報を確認できる。
- **Data Flow**: `App.jsx → Experience.jsx → UserAddedStars.jsx → UserStar.jsx`のプロップチェーンでデータが伝達される。

## UI

HTML オーバーレイとして実装されたユーザーインターフェース。

- **TailwindCSS**: グラスモーフィズム（すりガラス）デザインを採用し、夜空の雰囲気にマッチさせた。
- **Components**:
  - **Menu Button**: 画面右上の3点リーダーボタン。「日記を書く」でモーダルを開く。
  - **User Menu**: 画面左下のユーザーアイコン。テーマ変更・ログ・設定へのアクセス。
  - **Diary Modal**: 5つの気分スライダー（0~100）と「今日のいいこと」3つの入力欄。スマホではステップ分割（スライダー → テキスト入力）、PCでは2カラム表示。
  - **Star Detail Modal**: 星をクリックすると表示。感情分析結果・励ましメッセージ・今日のいいこと・座標などを確認できる。
  - **Theme Selection Modal**: カラーテーマ（3色）と背景タイプ（クラシック/ネビュラ）の切り替え。
- **App Integration**: `<Canvas>`の外側に配置され、3D シーンの上に重なって表示される。

## SkyBoxUpGrade

SkyBoxの代替として切り替え可能なシェーダー背景。GLSL Sandboxの星雲シェーダーをベースにした単一レイヤーの背景で、テーマ変更モーダルから選択できる。内部にDistantStarsを組み込んでいる。

## DistantStars

遠景の瞬く星を描画する独立コンポーネント。SkyBoxとSkyBoxUpGradeの両方で共有される。ハッシュベースのノイズで星の位置・サイズ・瞬きを生成し、propsで`position`・`density`・`size`を調整可能。

# 日記から星へ

「日記を書く」ことは、ただ記録を残すだけでなく、夜空に新しい星を打ち上げる行為としてデザインされています。

1. **Input**: ユーザーがモーダルを開き、5つの気分スライダー（情緒的安定性・動因の充足・社会的適応・生体的メカニズム・刺激の受容）を調整し、「今日のいいこと」を最大3つ入力して「打ち上げ」を押す。
2. **Analysis**: スライダー値と「今日のいいこと」がSupabase Edge Function経由でGemini APIに送信され、感情分析と励ましのフィードバックが生成される。
3. **State Update**: `App.jsx`で管理されている`userStars`ステートに、新しい星のデータ（日時、ランダムな座標・色・サイズ、分析結果）が追加される。
4. **Render**:
   - `Experience`コンポーネント内の`UserAddedStars`が更新を検知。
   - 新しい`UserStar`コンポーネントが 3D 空間上の指定座標に出現。
   - 独自のシェーダーマテリアルで輝き始め、ビルボード化されたテキストで日付が表示される。
5. **Interaction**:
   - ユーザーが星をクリックすると、`StarDetailModal`が開き、感情分析結果・励ましメッセージ・今日のいいことなどの詳細情報を表示。
6. **Result**: ユーザーの日々の気持ちと良かったことが、可視化された「星」となってプラネタリウムの一部になり、いつでもクリックして振り返ることができる。

# データベース接続

.env example に参照

# データベース構造

## 星データテーブル (t_stars)

| コラム        | データ型(supabase の選択肢で設置する) | ディフォルト値 | 説明                                                                                       |
| ------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| id🔑          | uuid                                  | NULL           | UUID で生成されたユニークな ID                                                             |
| position      | jsonb                                 | NULL           | 位置                                                                                       |
| color         | jsonb                                 | NULL           | 色                                                                                         |
| scale         | Float4                                | NULL           | 大きさ                                                                                     |
| random        | Float4                                | NULL           | 星の瞬きアニメーションの位相をずらすための値（各星が異なるタイミングで瞬くようにするため） |
| created_at    | timestamptz                           | NULL           | ISO フォーマットの生成日時（データベース保存用）                                           |
| display_date  | text                                  | NULL           | YY/MM/DD HH:mm フォーマットの生成日時（画面表示用）                                        |
| analysis_data | jsonb                                 | NULL           | Gemini API からの分析結果（感情、褒め言葉、今日のいいこと goodThings など）                |

# Gemini API の使用 (テスト用の TEST-API を実行する時に、学校のネットワークから弾かれる可能性もある、テザリングを使うのは推薦)

## 概要

API キーを安全に扱うため、クライアントサイドではなく **Supabase Edge Functions** 経由で Gemini API を呼び出します。

## Edge Function の構成 (`supabase/functions/analyze-diary/`)

- **API**: Google Gemini 2.5 Flash
- **機能**: ユーザーのスライダー値（5項目）と「今日のいいこと」を受け取り、感情を判定し `feedback`（星からの手紙）を返します。
- **認証**: Supabase の Anon Key で保護されています。

## セットアップ手順

1. **Gemini API キーの取得**: [Google AI Studio](https://aistudio.google.com/apikey) で取得
2. **Secret の設定**: Supabase Dashboard > Edge Functions > Secrets に `GEMINI_API_KEY` を設定
3. **デプロイ（注意 ⚠️ プロンプトが記載した index.ts を編集するたびに再デプロイが必要）**: 以下のコマンドでクラウドに反映
   ```bash
   npx supabase functions deploy analyze-diary --no-verify-jwt
   # または
   npm run deploy:analyze-diary
   ```
   - `--no-verify-jwt`: 401 Unauthorized を防ぐため、ログインなしで anon key のみで呼び出せるようにする

## 動作確認

PowerShell での文字化けを防ぐため、専用の Node.js スクリプトを使用します。

```bash
# テスト実行
node test-api.js
```

## GEMINI プロンプト更新時のフロー

1. `index.ts` を修正
2. `npx supabase functions deploy analyze-diary` でデプロイ
3. `node test-api.js` で動作確認

# プロンプト

```
`あなたは宇宙の星のように優しく見守る存在です。ユーザーが今日の気持ちを5つのスライダーで記録しました。

【今日の気持ち】
- 情緒的安定性: ${emotional}/100 (0=つらい・どんより、100=心地いい・穏やか)
- 動因の充足: ${motivation}/100 (0=無気力・不完全燃焼、100=やりきった・満足)
- 社会的適応: ${social}/100 (0=孤独・物足りない、100=充足感・満タン)
- 生体的メカニズム: ${physical}/100 (0=ずっしり重たい、100=すっきり軽やか)
- 刺激の受容: ${fulfillment}/100 (0=退屈・マンネリ、100=新鮮・充実していた)

判定された感情の状態: ${emotion}${goodThingsSection}

この気持ち${goodThingsList.length > 0 ? 'と今日のいいこと' : ''}に対して「星からの手紙」として、温かく共感的なメッセージを1-2文で生成してください。
${goodThingsList.length > 0 ? '今日のいいことに触れつつ、' : ''}ユーザーの気持ちをそのまま受け止め、前向きになれる言葉をかけてください。夜空の星が語りかけるような優しいトーンで。

回答は以下のJSON形式のみで返してください（他の説明やマークダウンは不要です）：
{
  "feedback": "フィードバックメッセージ"
}`
```

# github コミットメッセージ命名規約

| プレフィックス | 用途 |
|:---:|---|
| `fix` | バグ修正 |
| `hotfix` | クリティカルなバグ修正 |
| `add` | 新規（ファイル）機能追加 |
| `update` | 機能修正（バグではない） |
| `change` | 仕様変更 |
| `clean` | 整理（リファクタリング等） |
| `disable` | 無効化（コメントアウト等） |
| `remove` | 削除（ファイル） |
| `upgrade` | バージョンアップ |
| `revert` | 変更取り消し |
