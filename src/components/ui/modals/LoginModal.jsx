import { useState } from 'react'
import loginIllustration from '../../../assets/newUserWelcome.png'

// メールアドレスの正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// パスワード: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/**
 * ログインモーダル
 * セッションにUIDがない場合に全画面表示される。
 * 純黒背景（透明度なし）で、左に装飾画像、右にログインフォーム。
 */
export function LoginModal({ onLogin, onRegister }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    // フィールドごとのエラー
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    // 全体エラー（認証失敗など）
    const [generalError, setGeneralError] = useState('')

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // メールアドレス: 未入力チェック
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      valid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      // メールアドレス: フォーマットチェック
      setEmailError("正しいメールアドレスの形式で入力してください");
      valid = false;
    }

    // パスワード: 未入力チェック
    if (!password) {
      setPasswordError("パスワードを入力してください");
      valid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      // パスワード: フォーマットチェック
      setPasswordError("8文字以上、英字と数字を含めてください");
      valid = false;
    }

    return valid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError("");
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setGeneralError(err.message || "ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // エラーテキストのスタイル
  const fieldErrorStyle = {
    color: "#ff6b6b",
    fontSize: "12px",
    marginTop: "4px",
    marginBottom: "4px",
    paddingLeft: "16px",
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
      {/* ── スキップボタン（認証未実装のため） ── */}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          style={{
            position: "absolute",
            top: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 24px",
            backgroundColor: "transparent",
            color: "rgba(255, 255, 255, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            fontSize: "12px",
            cursor: "pointer",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease",
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "rgba(255, 255, 255, 0.7)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "rgba(255, 255, 255, 0.35)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
          }}
        >

            {/* ボタン */}
            <div
              style={{
                display: "flex",
                gap: "16px",
              }}
            >
              <button
                type="button"
                onClick={onRegister}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  border: "1.5px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: "24px",
                  fontSize: "14px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.target.style.borderColor = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "rgba(255,255,255,0.7)";
                }}
              >
                新規登録
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  border: "1.5px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: "24px",
                  fontSize: "14px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  letterSpacing: "0.08em",
                  transition: "all 0.2s ease",
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                    e.target.style.color = "#ffffff";
                    e.target.style.borderColor = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ffffff";
                  e.target.style.color = "#000000";
                  e.target.style.borderColor = "rgba(255,255,255,0.7)";
                }}
              >
                {isLoading ? "..." : "ログインする"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
