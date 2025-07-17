"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signInWithEmail(email, password);
      router.push("/");
    } catch (error: any) {
      setError(error.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || "Googleログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <img src="/logo.svg" alt="ロゴ" className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-2">ログイン</h1>
            <p className="text-sm text-gray-700 dark:text-gray-300">アカウントを使用してログイン</p>
          </div>
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin}>
            <div className="flex justify-center mb-4">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-80 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base placeholder-gray-600 dark:placeholder-gray-400 text-center text-gray-900 dark:text-gray-100"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-center mb-4">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-80 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base placeholder-gray-600 dark:placeholder-gray-400 text-center text-gray-900 dark:text-gray-100"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-center mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-80 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-80 mt-4 inline-flex justify-center items-center py-4 px-6 border-2 border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </button>
            </div>
          </div>

          <div className="mt-6 text-center space-y-3">
            <div>
              <Link href="/auth/reset-password" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                パスワードを忘れた場合
              </Link>
            </div>
            <div>
              <Link href="/auth/signup" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                アカウントを作成
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              ← ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
