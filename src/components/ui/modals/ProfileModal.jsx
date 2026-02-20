import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { useUserStore } from "../../../store/useUserStore";
import { useStarStore } from "../../../store/useStarStore";

/**
 * プロフィールモーダル
 * StarDetailModalと同じグラスモーフィズムデザイン
 * - モバイル: 画面中央、スクロール可能
 * - PC: 画面左寄りに配置
 */
export function ProfileModal({ isOpen, onClose }) {
    const { user } = useUserStore();
    const { stars } = useStarStore();

    // --- プロフィールデータ ---
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- ニックネーム編集 ---
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState("");
    const [nameSaving, setNameSaving] = useState(false);
    const nameInputRef = useRef(null);

    // --- メール変更 (OTPフロー) ---
    // 0=表示のみ, 1=新メール入力, 2=OTP入力
    const [emailStep, setEmailStep] = useState(0);
    const [newEmail, setNewEmail] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailError, setEmailError] = useState("");

    // --- パスワード変更 ---
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    // --- タグ ---
    const [tags, setTags] = useState([]);
    const [editingTagId, setEditingTagId] = useState(null);
    const [editingTagValue, setEditingTagValue] = useState("");
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagValue, setNewTagValue] = useState("");
    const newTagRef = useRef(null);
    const editTagRef = useRef(null);

    // --- データ取得 ---
    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
            fetchTags();
        }
        if (!isOpen) {
            setIsEditingName(false);
            setEmailStep(0);
            setEmailError("");
            setIsEditingPassword(false);
            setPasswordError("");
            setEditingTagId(null);
            setIsAddingTag(false);
        }
    }, [isOpen, user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("t_account")
                .select("user_name, registration_date")
                .eq("user_id", user.id)
                .single();
            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from("t_tag")
                .select("id, tag_name")
                .eq("creator_id", user.id)
                .order("creation_date", { ascending: true });
            if (error) throw error;
            setTags(data || []);
        } catch (err) {
            console.error("Tags fetch error:", err);
        }
    };

    // --- ニックネーム保存 ---
    const handleSaveName = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed.length < 3 || trimmed.length > 15) return;
        setNameSaving(true);
        try {
            const { error } = await supabase
                .from("t_account")
                .update({ user_name: trimmed })
                .eq("user_id", user.id);
            if (error) throw error;
            setProfile((prev) => ({ ...prev, user_name: trimmed }));
            setIsEditingName(false);
        } catch (err) {
            console.error("Name update error:", err);
        } finally {
            setNameSaving(false);
        }
    };

    // --- メール変更: OTP送信 ---
    const handleSendEmailOtp = async () => {
        if (!newEmail.trim()) return;
        setEmailSaving(true);
        setEmailError("");
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: newEmail.trim(),
                options: { shouldCreateUser: false },
            });
            if (error) throw error;
            setEmailStep(2);
        } catch (err) {
            setEmailError(err.message || "OTP送信に失敗しました");
        } finally {
            setEmailSaving(false);
        }
    };

    // --- メール変更: OTP検証 & 更新 ---
    const handleVerifyEmailOtp = async () => {
        if (!emailOtp.trim()) return;
        setEmailSaving(true);
        setEmailError("");
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: newEmail.trim(),
                token: emailOtp.trim(),
                type: "email",
            });
            if (verifyError) throw verifyError;
            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail.trim(),
            });
            if (updateError) throw updateError;
            setEmailStep(0);
            setNewEmail("");
            setEmailOtp("");
        } catch (err) {
            setEmailError(err.message || "検証に失敗しました");
        } finally {
            setEmailSaving(false);
        }
    };

    // --- パスワード変更 ---
    const handleSavePassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setPasswordError("8文字以上で入力してください");
            return;
        }
        setPasswordSaving(true);
        setPasswordError("");
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            setIsEditingPassword(false);
            setNewPassword("");
        } catch (err) {
            setPasswordError(err.message || "パスワード変更に失敗しました");
        } finally {
            setPasswordSaving(false);
        }
    };

    // --- タグ追加 ---
    const handleAddTag = async () => {
        const trimmed = newTagValue.trim();
        if (!trimmed || trimmed.length > 16) return;
        try {
            const { data, error } = await supabase
                .from("t_tag")
                .insert([{ creator_id: user.id, tag_name: trimmed }])
                .select("id, tag_name")
                .single();
            if (error) throw error;
            setTags((prev) => [...prev, data]);
            setNewTagValue("");
            setIsAddingTag(false);
        } catch (err) {
            console.error("Tag add error:", err);
        }
    };

    // --- タグ編集 ---
    const handleUpdateTag = async (tagId) => {
        const trimmed = editingTagValue.trim();
        if (!trimmed || trimmed.length > 16) {
            setEditingTagId(null);
            return;
        }
        try {
            const { error } = await supabase
                .from("t_tag")
                .update({ tag_name: trimmed })
                .eq("id", tagId)
                .eq("creator_id", user.id);
            if (error) throw error;
            setTags((prev) =>
                prev.map((t) => (t.id === tagId ? { ...t, tag_name: trimmed } : t))
            );
        } catch (err) {
            console.error("Tag update error:", err);
        } finally {
            setEditingTagId(null);
        }
    };

    // --- タグ削除 ---
    const handleDeleteTag = async (tagId) => {
        try {
            const { error } = await supabase
                .from("t_tag")
                .delete()
                .eq("id", tagId)
                .eq("creator_id", user.id);
            if (error) throw error;
            setTags((prev) => prev.filter((t) => t.id !== tagId));
        } catch (err) {
            console.error("Tag delete error:", err);
        }
    };

    // --- フォーカス制御 ---
    useEffect(() => {
        if (isEditingName && nameInputRef.current) nameInputRef.current.focus();
    }, [isEditingName]);

    useEffect(() => {
        if (isAddingTag && newTagRef.current) newTagRef.current.focus();
    }, [isAddingTag]);

    useEffect(() => {
        if (editingTagId && editTagRef.current) editTagRef.current.focus();
    }, [editingTagId]);

    if (!isOpen) return null;

    // --- 登録日フォーマット ---
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}/${m}/${day}`;
    };

    const starCount = stars ? stars.length : 0;

    // --- 編集アイコンボタン ---
    const editIconButton = (onClick) => (
        <button
            onClick={onClick}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 flex-shrink-0"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5 text-white/60"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
            </svg>
        </button>
    );

    // --- メインレンダリング ---
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:justify-start md:pl-8"
            onClick={onClose}
        >
            {/* バックドロップ — StarDetailModalと同じ */}
            <div className="absolute inset-0 bg-black/20 transition-opacity duration-300" />

            {/* モーダル本体 — StarDetailModalと同じグラスモーフィズム */}
            <div
                className="relative z-10 w-full max-w-sm bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto scrollbar-hidden"
                style={{ padding: "10px 30px 30px 30px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-2 py-6">
                    {/* 閉じるボタン (X) — StarDetailModalと同じ */}
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={onClose}
                            className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
                            aria-label="閉じる"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* --- ユーザー名 --- */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 w-full max-w-[240px]">
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveName();
                                                if (e.key === "Escape") setIsEditingName(false);
                                            }}
                                            maxLength={15}
                                            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-center text-lg font-bold focus:outline-none focus:ring-1 focus:ring-white/30"
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            disabled={nameSaving}
                                            className="px-3 py-1.5 bg-white/15 text-white/90 text-xs rounded-full hover:bg-white/25 transition-colors disabled:opacity-50"
                                        >
                                            {nameSaving ? "..." : "保存"}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-white/95 text-xl font-bold tracking-wide px-5 py-2 bg-white/5 rounded-full border border-white/10">
                                            {profile?.user_name || "---"}
                                        </span>
                                        {editIconButton(() => {
                                            setEditName(profile?.user_name || "");
                                            setIsEditingName(true);
                                        })}
                                    </>
                                )}
                            </div>

                            {/* --- 統計 --- */}
                            <div className="flex items-center justify-center gap-0 mb-4">
                                <div className="text-center px-6">
                                    <div className="text-white/95 text-2xl font-bold tabular-nums">
                                        {starCount}
                                    </div>
                                    <div className="text-white/50 text-xs mt-1 leading-tight tracking-wide">
                                        打ち上げ
                                        <br />
                                        た星
                                    </div>
                                </div>
                                <div className="w-px h-12 bg-white/20" />
                                <div className="text-center px-6">
                                    <div className="text-white/95 text-2xl font-bold tabular-nums">
                                        0
                                    </div>
                                    <div className="text-white/50 text-xs mt-1 leading-tight tracking-wide">
                                        完成し
                                        <br />
                                        た星座
                                    </div>
                                </div>
                            </div>

                            {/* --- 登録日 --- */}
                            <div className="text-center mb-6">
                                <span className="text-white/40 text-xs tracking-[0.15em]">
                                    {formatDate(profile?.registration_date)}に登録
                                </span>
                            </div>

                            {/* --- メールアドレス --- */}
                            <div className="mb-5" style={{ padding: "5px 0" }}>
                                <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-2">
                                    メールアドレス
                                </p>
                                {emailStep === 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-4 py-2.5 bg-white/8 rounded-full text-white/80 text-sm truncate border border-white/5">
                                            {user?.email || "---"}
                                        </div>
                                        {editIconButton(() => setEmailStep(1))}
                                    </div>
                                )}
                                {emailStep === 1 && (
                                    <div className="space-y-2">
                                        <input
                                            type="email"
                                            placeholder="新しいメールアドレス"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white/8 border border-white/10 rounded-full text-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-white/30"
                                        />
                                        {emailError && (
                                            <p className="text-red-400 text-xs px-2">{emailError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSendEmailOtp}
                                                disabled={emailSaving}
                                                className="flex-1 py-2 bg-white/10 text-white/90 text-xs rounded-full hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-50"
                                            >
                                                {emailSaving ? "送信中..." : "確認コードを送信"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEmailStep(0);
                                                    setEmailError("");
                                                }}
                                                className="px-3 py-2 text-white/40 text-xs hover:text-white/70 transition-colors"
                                            >
                                                戻る
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {emailStep === 2 && (
                                    <div className="space-y-2">
                                        <p className="text-white/50 text-xs px-2">
                                            {newEmail} に確認コードを送信しました
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="確認コード (6桁)"
                                            value={emailOtp}
                                            onChange={(e) => setEmailOtp(e.target.value)}
                                            maxLength={6}
                                            className="w-full px-4 py-2.5 bg-white/8 border border-white/10 rounded-full text-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-white/30"
                                            style={{ letterSpacing: "0.3em", textAlign: "center" }}
                                        />
                                        {emailError && (
                                            <p className="text-red-400 text-xs px-2">{emailError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleVerifyEmailOtp}
                                                disabled={emailSaving}
                                                className="flex-1 py-2 bg-white/10 text-white/90 text-xs rounded-full hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-50"
                                            >
                                                {emailSaving ? "検証中..." : "確認"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEmailStep(0);
                                                    setEmailError("");
                                                }}
                                                className="px-3 py-2 text-white/40 text-xs hover:text-white/70 transition-colors"
                                            >
                                                戻る
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- パスワード --- */}
                            <div className="mb-6" style={{ padding: "5px 0" }}>
                                <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-2">
                                    パスワード
                                </p>
                                {!isEditingPassword ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-4 py-2.5 bg-white/8 rounded-full text-white/80 text-sm tracking-widest border border-white/5">
                                            ●●●●●●●●
                                        </div>
                                        {editIconButton(() => setIsEditingPassword(true))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="password"
                                            placeholder="新しいパスワード（8文字以上）"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white/8 border border-white/10 rounded-full text-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-white/30"
                                        />
                                        {passwordError && (
                                            <p className="text-red-400 text-xs px-2">
                                                {passwordError}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSavePassword}
                                                disabled={passwordSaving}
                                                className="flex-1 py-2 bg-white/10 text-white/90 text-xs rounded-full hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-50"
                                            >
                                                {passwordSaving ? "変更中..." : "パスワードを変更"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingPassword(false);
                                                    setPasswordError("");
                                                    setNewPassword("");
                                                }}
                                                className="px-3 py-2 text-white/40 text-xs hover:text-white/70 transition-colors"
                                            >
                                                戻る
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- タグ --- */}
                            <div style={{ padding: "5px 0" }}>
                                <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-3 text-center">
                                    タグ
                                </p>
                                <div className="flex flex-wrap gap-2 items-center justify-center">
                                    {tags.map((tag) => (
                                        <div key={tag.id} className="relative group">
                                            {editingTagId === tag.id ? (
                                                <input
                                                    ref={editTagRef}
                                                    type="text"
                                                    value={editingTagValue}
                                                    onChange={(e) =>
                                                        setEditingTagValue(e.target.value)
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdateTag(tag.id);
                                                        if (e.key === "Escape") setEditingTagId(null);
                                                    }}
                                                    onBlur={() => handleUpdateTag(tag.id)}
                                                    maxLength={16}
                                                    className="w-28 px-3 py-1.5 bg-white/15 border border-white/30 rounded-full text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-white/40"
                                                />
                                            ) : (
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTagId(tag.id);
                                                            setEditingTagValue(tag.tag_name);
                                                        }}
                                                        className="px-4 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-full text-white/80 text-xs transition-colors duration-200 cursor-pointer"
                                                    >
                                                        #{tag.tag_name}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTag(tag.id);
                                                        }}
                                                        className="w-5 h-5 -ml-2 flex items-center justify-center rounded-full bg-red-500/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500/90 text-[10px]"
                                                        style={{ lineHeight: 1 }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {isAddingTag && (
                                        <input
                                            ref={newTagRef}
                                            type="text"
                                            value={newTagValue}
                                            onChange={(e) => setNewTagValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAddTag();
                                                if (e.key === "Escape") {
                                                    setIsAddingTag(false);
                                                    setNewTagValue("");
                                                }
                                            }}
                                            onBlur={() => {
                                                if (newTagValue.trim()) {
                                                    handleAddTag();
                                                } else {
                                                    setIsAddingTag(false);
                                                }
                                            }}
                                            placeholder="タグ名"
                                            maxLength={16}
                                            className="w-28 px-3 py-1.5 bg-white/15 border border-white/30 rounded-full text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-white/40 placeholder-white/30"
                                        />
                                    )}

                                    <button
                                        onClick={() => {
                                            setIsAddingTag(true);
                                            setNewTagValue("");
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 border border-white/10 transition-colors duration-200"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-white/50"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 4.5v15m7.5-7.5h-15"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
