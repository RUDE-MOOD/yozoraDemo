import { useState } from "react";
import loginIllustration from "../../../assets/newUserWelcome.png";

// メールアドレスの正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// パスワード: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// 利用規約の全文
const TERMS_OF_SERVICE = `
本利用規約（以下「本規約」といいます。）は、TEAM 03（以下「当社」といいます。）が提供するノスタージア（Webサイト・アプリを含み、以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様（以下「ユーザー」といいます。）には、本規約に同意のうえ、本サービスをご利用いただきます。

第1条（適用）

1.本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。

2.当社が本サービス上で掲載するルールやガイドライン等は、本規約の一部を構成するものとします。

第2条（利用登録）

1.本サービスの利用にあたり、登録が必要な場合、ユーザーは当社の定める方法により利用登録を行うものとします。

2.当社は、以下の場合には利用登録を承認しないことがあります。
 ・登録内容に虚偽がある場合
 ・過去に本規約に違反したことがある場合
 ・その他、当社が不適切と判断した場合

第3条（ユーザーIDおよびパスワードの管理）

1.ユーザーは、自己の責任においてユーザーIDおよびパスワードを管理するものとします。

2.ユーザーIDおよびパスワードの第三者による使用により生じた損害について、当社は一切の責任を負いません。

第4条（禁止事項）

ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
・法令または公序良俗に違反する行為
・犯罪行為に関連する行為
・当社、他のユーザー、第三者の権利を侵害する行為
・本サービスの運営を妨害する行為
・不正アクセス、またはこれを試みる行為
・その他、当社が不適切と判断する行為

第5条（本サービスの提供の停止等）

1.当社は、以下の場合には、事前の通知なく本サービスの全部または一部を停止または中断することができます。
・システムの保守点検または更新を行う場合
・天災、停電、通信障害等によりサービス提供が困難な場合
・その他、当社が必要と判断した場合

2.本サービスの停止等によりユーザーに生じた損害について、当社は責任を負いません。

第6条（知的財産権）

本サービスに関する著作権、商標権その他の知的財産権は、当社または正当な権利者に帰属します。ユーザーは、無断で複製、転載、改変等を行ってはなりません。

第7条（免責事項）

1.当社は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。

2.本サービスの利用によりユーザーに生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。

第8条（利用規約の変更）

当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができます。変更後の規約は、本サービス上に掲載した時点から効力を生じるものとします。

第9条（準拠法・管轄）

本規約の解釈には日本法を準拠法とします。本サービスに関して紛争が生じた場合には、【管轄裁判所（例：東京地方裁判所）】を専属的合意管轄とします。

以上`;

/**
 * 新規登録モーダル
 * ログインモーダルから「新規登録」ボタンで遷移。
 * 左にフォーム、右に利用規約テキスト。背景にイラスト。
 */
export function RegisterModal({ onRegister, onBackToLogin }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // フィールドごとのエラー
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const setFieldError = (field, msg) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };
  const clearFieldError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    let valid = true;

    if (!userName.trim()) {
      newErrors.userName = "ユーザー名を入力してください";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
      valid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "正しいメールアドレスの形式で入力してください";
      valid = false;
    }

    if (!password) {
      newErrors.password = "パスワードを入力してください";
      valid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password = "8文字以上、英字と数字を含めてください";
      valid = false;
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = "確認用パスワードを入力してください";
      valid = false;
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "パスワードが一致しません";
      valid = false;
    }

    if (!agreeTerms) {
      newErrors.terms = "利用規約に同意してください";
      valid = false;
    }

    // 誕生日バリデーション
    if (!birthYear || !birthMonth || !birthDay) {
      newErrors.birthday = "誕生日を選択してください";
      valid = false;
    } else {
      const y = parseInt(birthYear);
      const m = parseInt(birthMonth);
      const d = parseInt(birthDay);
      const selected = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected > today) {
        newErrors.birthday = "未来の日付は選択できません";
        valid = false;
      }
    }

    setErrors(newErrors);
    setGeneralError("");
    return valid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError("");
    try {
      await onRegister({
        userName: userName.trim(),
        email: email.trim(),
        password,
        birthday: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      });
    } catch (err) {
      setGeneralError(err.message || "登録に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 共通スタイル
  const labelStyle = {
    display: "block",
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "6px",
    letterSpacing: "0.05em",
  };
  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: hasError ? "2px solid #ff6b6b" : "2px solid transparent",
    borderRadius: "24px",
    fontSize: "13px",
    color: "#1a1a1a",
    outline: "none",
    transition: "border-color 0.2s ease",
  });
  const fieldErrorStyle = {
    color: "#ff6b6b",
    fontSize: "11px",
    marginTop: "3px",
    paddingLeft: "14px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      }}
    >
      {/* 背景イラスト — 中央にうっすら表示 */}
      <img
        src={loginIllustration}
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "420px",
          height: "auto",
          opacity: 0.06,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          maxWidth: "960px",
          padding: "30px 40px",
          gap: "32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── 左側: 登録フォーム ── */}
        <div
          style={{
            flex: "1 1 45%",
            maxWidth: "380px",
          }}
        >
          <form onSubmit={handleRegister}>
            {/* ユーザー名 */}
            <label style={labelStyle}>ユーザー名</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                clearFieldError("userName");
              }}
              style={inputStyle(errors.userName)}
            />
            {errors.userName && (
              <div style={fieldErrorStyle}>{errors.userName}</div>
            )}
            <div style={{ marginBottom: errors.userName ? "10px" : "16px" }} />

            {/* メールアドレス */}
            <label style={labelStyle}>メールアドレス</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              style={inputStyle(errors.email)}
            />
            {errors.email && <div style={fieldErrorStyle}>{errors.email}</div>}
            <div style={{ marginBottom: errors.email ? "10px" : "16px" }} />

            {/* パスワード */}
            <label style={labelStyle}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              style={inputStyle(errors.password)}
            />
            {errors.password && (
              <div style={fieldErrorStyle}>{errors.password}</div>
            )}
            <div style={{ marginBottom: errors.password ? "10px" : "16px" }} />

            {/* パスワード確認 */}
            <label style={labelStyle}>パスワード（確認）</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clearFieldError("passwordConfirm");
              }}
              style={inputStyle(errors.passwordConfirm)}
            />
            {errors.passwordConfirm && (
              <div style={fieldErrorStyle}>{errors.passwordConfirm}</div>
            )}
            <div
              style={{ marginBottom: errors.passwordConfirm ? "10px" : "16px" }}
            />

            {/* 誕生日 */}
            <label style={labelStyle}>誕生日</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {/* 年 */}
              <select
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  setBirthDay("");
                  clearFieldError("birthday");
                }}
                style={{
                  ...inputStyle(errors.birthday),
                  width: "110px",
                  textAlign: "center",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: "28px",
                }}
              >
                <option value="">年</option>
                {Array.from(
                  { length: new Date().getFullYear() - 1900 + 1 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {/* 月 */}
              <select
                value={birthMonth}
                onChange={(e) => {
                  setBirthMonth(e.target.value);
                  setBirthDay("");
                  clearFieldError("birthday");
                }}
                style={{
                  ...inputStyle(errors.birthday),
                  width: "80px",
                  textAlign: "center",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "24px",
                }}
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
              {/* 日 */}
              <select
                value={birthDay}
                onChange={(e) => {
                  setBirthDay(e.target.value);
                  clearFieldError("birthday");
                }}
                style={{
                  ...inputStyle(errors.birthday),
                  width: "80px",
                  textAlign: "center",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "24px",
                }}
              >
                <option value="">日</option>
                {(() => {
                  const y = parseInt(birthYear) || 2000;
                  const m = parseInt(birthMonth) || 1;
                  const days = new Date(y, m, 0).getDate();
                  return Array.from({ length: days }, (_, i) => i + 1).map(
                    (d) => (
                      <option key={d} value={d}>
                        {String(d).padStart(2, "0")}
                      </option>
                    ),
                  );
                })()}
              </select>
            </div>
            {errors.birthday && (
              <div style={fieldErrorStyle}>{errors.birthday}</div>
            )}
          </form>
        </div>

        {/* ── 右側: 利用規約 + 同意 + ボタン ── */}
        <div
          style={{
            flex: "1 1 45%",
            maxWidth: "380px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* 利用規約ボックス */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              borderRadius: "12px",
              padding: "16px 18px",
              height: "320px",
              overflowY: "auto",
              fontSize: "11px",
              lineHeight: "1.7",
              color: "#333",
            }}
            className="scrollbar-hidden"
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#1a1a1a",
              }}
            >
              利用規約：
            </div>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {TERMS_OF_SERVICE}
            </div>
          </div>

          {/* 利用規約の同意チェック */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAgreeTerms(!agreeTerms);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: errors.terms
                  ? "2px solid #ff6b6b"
                  : agreeTerms
                    ? "2px solid #ffffff"
                    : "2px solid rgba(255,255,255,0.4)",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "all 0.2s ease",
              }}
            >
              {agreeTerms && (
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                  }}
                />
              )}
            </button>
            <span
              style={{
                color: errors.terms ? "#ff6b6b" : "rgba(255,255,255,0.7)",
                fontSize: "13px",
                cursor: "pointer",
                userSelect: "none",
                transition: "color 0.2s ease",
              }}
              onClick={() => {
                setAgreeTerms(!agreeTerms);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
            >
              利用規約の同意する
            </span>
          </div>

          {/* 全体エラー */}
          {generalError && (
            <div
              style={{
                color: "#ff6b6b",
                fontSize: "12px",
                textAlign: "center",
                padding: "8px 12px",
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 107, 107, 0.3)",
              }}
            >
              {generalError}
            </div>
          )}

          {/* ボタン行 */}
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            {/* 戻るボタン */}
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "rgba(255,255,255,0.5)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                borderRadius: "24px",
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#ffffff";
                e.target.style.borderColor = "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "rgba(255,255,255,0.5)";
                e.target.style.borderColor = "rgba(255,255,255,0.3)";
              }}
            >
              ← 戻る
            </button>

            {/* アカウントを作成 */}
            <button
              type="button"
              onClick={handleRegister}
              disabled={isLoading}
              style={{
                padding: "10px 24px",
                backgroundColor: "#ffffff",
                color: "#000000f",
                border: "1.5px solid rgba(255, 255, 255, 0.7)",
                borderRadius: "24px",
                fontSize: "13px",
                cursor: isLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.08em",
                transition: "all 0.2s ease",
                opacity: isLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.target.style.borderColor = "#ffffff";
                  e.target.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ffffffff";
                e.target.style.borderColor = "rgba(255,255,255,0.7)";
                e.target.style.color = "#000000";
              }}
            >
              {isLoading ? "..." : "アカウントを作成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
