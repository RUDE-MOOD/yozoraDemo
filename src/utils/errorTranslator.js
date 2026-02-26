export const translateAuthError = (err) => {
    if (!err) return "エラーが発生しました。";
    const message = typeof err === 'string' ? err : err.message || "";

    if (message.includes("already been registered") || message === "User already registered") {
        return "このメールアドレスは既に登録されています。";
    }
    if (message.includes("Invalid login credentials")) {
        return "メールアドレスまたはパスワードが間違っています。";
    }
    if (message.includes("Password should be at least")) {
        return "パスワードは短すぎます（8文字以上必要です）。";
    }
    if (message.includes("Token has expired or is invalid")) {
        return "コードの有効期限が切れているか、無効です。";
    }
    if (message.includes("Email link is invalid or has expired")) {
        return "リンクが無効か、期限切れです。";
    }
    if (message.includes("Email rate limit exceeded") || message.includes("rate limit")) {
        return "メール送信の制限を超えました。しばらく待ってから再度お試しください。";
    }
    if (message.includes("User not found")) {
        return "ユーザーが見つかりません。";
    }

    return message;
};
