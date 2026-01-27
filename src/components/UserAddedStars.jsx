/*
  [機能解説: ユーザー操作による星の生成フロー]

  1. ユーザーアクション (UI.jsx):
     - ユーザーが日記パネルでテキストを入力し、「送信」ボタンをクリックします。
     - handleSend関数がonSendコールバックを通じてApp.jsxにテキストを渡します。

  2. ステート更新 (App.jsx):
     - handleAddStar関数が呼び出されます。
     - 現在の日時を取得し、表示用フォーマット (例: "26/1/26 16:25") に変換します。
     - 星の座標 (X, Y, Z) をランダムに決定します。この際、カメラが見ることのできる範囲内 (-320~320, -160~160) に収まるように計算されます。
     - 星の色やサイズもランダムに生成され、userStarsステートの配列に新しい星オブジェクトとして追加されます。

  3. リアクティブな描画 (Experience.jsx -> UserAddedStars.jsx):
     - userStarsステートの更新検知により、Experienceコンポーネントが再レンダリングされます。
     - 新しい配列データがUserAddedStarsコンポーネントにpropsとして渡されます。
     - UserAddedStarsは配列をmapし、新しいUserStarコンポーネントを生成します。

  4. 星の出現 (UserStar.jsx):
     - 指定された座標に星が表示されます。
     - SingleStarMaterial (カスタムシェーダー) により、時間経過と共にキラキラと瞬きます。
     - Billboardコンポーネントにより、星とその下の日付テキストは常にカメラの方を向くようになります。
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
