/*
  [機能解説: ユーザー操作による星の生成フロー]

  
  このコンポーネントの`stars`プロップは、以下のデータフローで渡されます：
  
  App.jsx (userStarsステート) 
    → Experience.jsx (userStarsプロップ) 
      → UserAddedStars.jsx (starsプロップ) ★ここ！
        → UserStar.jsx (個別の星データ)

  ＝＝＝ 詳細なデータフロー ＝＝＝

  【ステップ1: ステートの初期化 (App.jsx)】
  
  App.jsx - 9行目:
    ```javascript
    const [userStars, setUserStars] = useState([]);
    ```
    
    - 初期値: 空の配列 []
    - このステートが全てのユーザー作成星のデータを保持する
    - Reactのステート管理により、更新されると自動的に再レンダリングされる

  【ステップ2: ユーザーアクション (UI.jsx)】
  
  1. ユーザーが日記パネルでテキストを入力し、「送信」ボタンをクリック
  2. UI.jsx - handleSend関数が実行される:
     ```javascript
     const handleSend = () => {
       if (onSend && diaryText.trim() !== '') {
         onSend(diaryText); // ← App.jsxのhandleAddStarを呼び出す
       }
       setDiaryText('');
       setDiaryOpen(false);
     };
     ```

  【ステップ3: 星データの生成 (App.jsx)】
  
  App.jsx - handleAddStar関数 (14～58行目):
    ```javascript
    const handleAddStar = (text) => {
      // 1. 現在の日時を取得してフォーマット
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const dateStr = `${year}/${month}/${day} ${hours}:${minutes}`;
      
      // 2. ランダムな3D座標を生成
      const x = (Math.random() - 0.5) * 600;  // -300 ~ 300
      const y = (Math.random() - 0.5) * 300;  // -150 ~ 150
      const z = -10 + (Math.random() - 0.5) * 15; // -17.5 ~ -2.5
      
      // 3. ランダムな色を生成（HSL形式）
      const randomType = Math.random();
      const color = new THREE.Color();
      if (randomType > 0.9) {
        color.setHSL(0.8 + Math.random() * 0.15, 0.9, 0.8); // ピンク/マゼンタ
      } else if (randomType > 0.75) {
        color.setHSL(0.08 + Math.random() * 0.12, 0.9, 0.8); // ゴールド/オレンジ
      } else if (randomType > 0.5) {
        color.setHSL(0.45 + Math.random() * 0.1, 0.8, 0.8); // シアン/グリーン
      } else {
        color.setHSL(0.6 + Math.random() * 0.1, 0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.2); // 青/白
      }
      
      // 4. 新しい星オブジェクトを作成
      const newStar = {
        id: Date.now(),                      // ユニークID（タイムスタンプ）
        position: [x, y, z],                 // 3D座標
        color: color,                        // THREE.Colorオブジェクト
        scale: 2.0 + Math.random() * 4.0,    // 大きさ（2.0～6.0）
        random: Math.random(),               // 瞬きアニメーション用（0.0～1.0）
        date: dateStr,                       // 生成日時の文字列
        text: text                           // ユーザーが入力した日記テキスト
      };
      
      // 5. userStarsステートを更新（新しい星を配列に追加）
      setUserStars((prev) => [...prev, newStar]);
      //           ^^^^      ^^^^^^^^^^^^^^^^
      //           |         既存の配列 + 新しい星
      //           前の状態
    };
    ```
    
    更新後のuserStarsの例:
    ```javascript
    [
      {
        id: 1706345678901,
        position: [125.45, -67.32, -8.91],
        color: THREE.Color { r: 0.65, g: 0.54, b: 0.98 },
        scale: 4.23,
        random: 0.742,
        date: '26/1/27 16:02',
        text: '今日はいい天気だった'
      },
      {
        id: 1706345689123,
        position: [-89.12, 45.67, -12.34],
        color: THREE.Color { r: 0.92, g: 0.78, b: 0.45 },
        scale: 3.56,
        random: 0.234,
        date: '26/1/27 16:05',
        text: '明日も頑張ろう'
      }
      // ... さらに星が追加される
    ]
    ```

  【ステップ4: データの伝達 (App.jsx → Experience.jsx)】
  
  App.jsx - 75行目:
    ```javascript
    <Experience userStars={userStars} onStarClick={starClickHandler} />
    //          ^^^^^^^^^^^^^^^^^^^^
    //          userStarsステートをuserStarsプロップとして渡す
    ```
    
  Experience.jsx - 25行目:
    ```javascript
    export const Experience = ({ userStars = [], onStarClick }) => {
    //                           ^^^^^^^^^^
    //                           App.jsxから受け取ったuserStars
    ```

  【ステップ5: データの伝達 (Experience.jsx → UserAddedStars.jsx)】
  
  Experience.jsx - 31行目:
    ```javascript
    <UserAddedStars stars={userStars} onStarClick={onStarClick} />
    //              ^^^^^^^^^^^^^^^^^
    //              userStarsをstarsプロップとして渡す
    ```
    
  UserAddedStars.jsx - 26行目（このファイル）:
    ```javascript
    export function UserAddedStars({ stars, onStarClick }) {
    //                               ^^^^^
    //                               Experience.jsxから受け取ったstars
    //                               これはApp.jsxのuserStarsステートと同じデータ！
    ```

  【ステップ6: 配列のマッピング (UserAddedStars.jsx)】
  
  29行目:
    ```javascript
    {stars.map((star) => (
    //    ^^^
    //    starsプロップ（配列）の各要素に対してループ
    //    
    //    例: stars = [星1, 星2, 星3]
    //    → 星1でUserStarを作成
    //    → 星2でUserStarを作成
    //    → 星3でUserStarを作成
      
      <UserStar
        key={star.id}           // Reactのキー（ユニークID）
        position={star.position} // [x, y, z]
        color={star.color}       // THREE.Color
        scale={star.scale}       // 大きさ
        random={star.random}     // 瞬きアニメーション用
        date={star.date}         // 生成日時
        starData={star}          // 星の全データ（モーダル表示用）
        onStarClick={onStarClick} // クリックハンドラー
      />
    ))}
    ```

  【ステップ7: 星の出現 (UserStar.jsx)】
  
  - 指定された座標に星が表示される
  - SingleStarMaterial (カスタムシェーダー) により、時間経過と共にキラキラと瞬く
  - Billboardコンポーネントにより、星とその下の日付テキストは常にカメラの方を向く

  ＝＝＝ まとめ ＝＝＝
  
  starsプロップの出所:
  1. App.jsx で userStars ステートとして管理（useState）
  2. ユーザーが日記を書くと handleAddStar が実行される
  3. 新しい星オブジェクトが作成され、setUserStars で配列に追加
  4. App.jsx → Experience.jsx → UserAddedStars.jsx とプロップで伝達
  5. UserAddedStars.jsx で stars.map() により各星を描画
  
  データの流れ:
  ユーザー入力 → App.jsx (ステート更新) → Experience.jsx (プロップ) 
    → UserAddedStars.jsx (プロップ) → UserStar.jsx (個別レンダリング)
*/
import { UserStar } from './UserStar'

export function UserAddedStars({ stars, onStarClick }) {
  return (
    <group name="Layer6_UserStars">
      {stars.map((star) => (
        <UserStar
          key={star.id}
          position={star.position}
          color={star.color}
          scale={star.scale}
          random={star.random}
          date={star.date}
          starData={star}
          onStarClick={onStarClick}
        />
      ))}
    </group>
  )
}
