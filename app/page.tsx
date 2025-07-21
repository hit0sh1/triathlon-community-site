import { getPopularPosts, PopularPost } from "@/lib/board-popular";
import { ArrowRight, BookOpen, Calendar, Users } from "lucide-react";
import Link from "next/link";
import NotificationSectionWrapper from "@/components/home/NotificationSectionWrapper";

export default async function Home() {

  // 人気の掲示板投稿を取得
  let popularPosts: PopularPost[] = [];
  try {
    popularPosts = await getPopularPosts(3);
  } catch (error) {
    console.error("Error fetching popular posts:", error);
    // エラーの場合は空配列のまま進む
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section with Advanced Design */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-900 dark:to-black"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-80 h-80 bg-white/15 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/3 w-72 h-72 bg-white/8 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "4s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-float"
            style={{ animationDelay: "6s" }}
          ></div>
        </div>

        {/* Content */}
        <div className="container-premium relative z-10">
          <div className="flex items-center justify-center min-h-screen py-24">
            {/* Content - Centered */}
            <div className="text-center animate-fade-in-up max-w-4xl mx-auto">
              <h1 className="heading-1 text-white mb-8 japanese-text">
                <span className="text-white">沖縄トライアスロン</span>
                <br />
                <span className="text-white">コミュニティ</span>
              </h1>
              <p className="body-large text-white/95 mb-12 leading-relaxed">
                美しい沖縄の海と風を感じながら、
                <br />
                仲間と共に最高のトレーニング体験を。
                <br />
                初心者から上級者まで、みんなが楽しめるコミュニティです。
              </p>
              <div className="flex justify-center items-center">
                <Link
                  href="/auth/signup"
                  className="group bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-2xl rounded-xl transition-all duration-300 border-2 border-white hover:border-gray-200"
                >
                  <span className="flex items-center gap-3">
                    コミュニティに参加
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="pt-16 lg:pt-24 pb-16 lg:pb-24 bg-gray-50 dark:bg-gray-900">
        <div className="container-premium">
          <div className="max-w-4xl mx-auto">
            <NotificationSectionWrapper limit={5} showTitle={true} />
          </div>
        </div>
      </section>

      {/* Popular Posts Section */}
      <section className="section-spacing bg-gray-50 dark:bg-gray-900">
        <div className="container-premium">
          {/* PC Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 xl:grid-cols-7 gap-16 items-start">
              {/* Left Column - Title and Description */}
              <div className="xl:col-span-3 animate-fade-in-up">
                <div className="sticky top-32">
                  <h2 className="heading-2 mb-6 japanese-text text-black dark:text-white">人気の掲示板投稿</h2>
                  <p className="body-large text-black dark:text-white mb-8 leading-relaxed">
                    コミュニティで話題になっている投稿をチェック。
                    <br />
                    初心者の質問から上級者のテクニックまで、様々な情報が交換されています。
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-black dark:text-white font-bold text-sm">初</span>
                      </div>
                      <span className="text-sm font-medium text-black dark:text-white">初心者質問</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-black dark:text-white font-bold text-sm">募</span>
                      </div>
                      <span className="text-sm font-medium text-black dark:text-white">練習仲間募集</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-black dark:text-white font-bold text-sm">大</span>
                      </div>
                      <span className="text-sm font-medium text-black dark:text-white">大会情報</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/board"
                      className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                    >
                      <span>掲示板を見る</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column - Posts */}
              <div className="xl:col-span-4">
                <div className="space-y-6">
                  {popularPosts.length === 0 ? (
                    <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-black dark:text-white">まだ投稿がありません</p>
                    </div>
                  ) : null}
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/board/posts/${post.id}`}
                      className="block animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg group hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <img
                            src={
                              post.profiles.avatar_url ||
                              "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop&crop=face"
                            }
                            alt={post.profiles.display_name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full text-xs font-semibold">
                                {post.board_categories.name}
                              </span>
                              <span className="text-black dark:text-white text-xs font-medium">
                                {new Date(post.created_at || "").toLocaleDateString("ja-JP")}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 japanese-text text-black dark:text-white group-hover:text-blue-600 transition-colors">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-6 text-sm text-black dark:text-white">
                              <span className="font-semibold text-black dark:text-white">
                                {post.profiles.display_name}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className="font-medium">{post.reply_count} 返信</span>
                                <span className="font-medium">{post.view_count || 0} 閲覧</span>
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            size={20}
                            className="text-black dark:text-white group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="heading-2 mb-6 japanese-text text-black dark:text-white">人気の掲示板投稿</h2>
              <p className="body-large text-black dark:text-white max-w-3xl mx-auto leading-relaxed">
                コミュニティで話題になっている投稿をチェック。
                <br />
                初心者の質問から上級者のテクニックまで、様々な情報が交換されています。
              </p>
            </div>

            <div className="space-y-6">
              {popularPosts.length === 0 ? (
                <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-black dark:text-white">まだ投稿がありません</p>
                </div>
              ) : null}
              {popularPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/board/posts/${post.id}`}
                  className="block animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg group hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <img
                        src={
                          post.profiles.avatar_url ||
                          "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop&crop=face"
                        }
                        alt={post.profiles.display_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full text-xs font-semibold">
                            {post.board_categories.name}
                          </span>
                          <span className="text-black dark:text-white text-xs font-medium">
                            {new Date(post.created_at || "").toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 japanese-text text-black dark:text-white group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-black dark:text-white">
                          <span className="font-semibold text-black dark:text-white">{post.profiles.display_name}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{post.reply_count} 返信</span>
                            <span className="font-medium">{post.view_count || 0} 閲覧</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-black dark:text-white group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12 animate-fade-in-up">
              <Link
                href="/board"
                className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="font-semibold">掲示板を見る</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-900 dark:to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-800/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-10 right-10 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        </div>

        <div className="container-premium relative z-10">
          {/* PC Layout */}
          <div className="hidden lg:block">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-fade-in-up">
                <h2 className="heading-2 text-white mb-8 japanese-text">コミュニティに参加しよう</h2>
                <p className="body-large text-white/95 mb-12 leading-relaxed">
                  沖縄の美しい自然の中で、一緒にトレーニングを楽しみましょう。
                  <br />
                  初心者から上級者まで、みんなが楽しめるコミュニティです。
                  <br />
                  今すぐ私たちの仲間になって、素晴らしいトライアスロンライフを始めましょう！
                </p>
                <div className="max-w-2xl mx-auto space-y-8">
                  <Link
                    href="/board"
                    className="group flex items-center gap-4 p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-black/30 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-bold text-lg mb-1">掲示板で交流する</h3>
                      <p className="text-white/70 text-sm">コミュニティのメンバーと情報を交換</p>
                    </div>
                    <ArrowRight
                      size={20}
                      className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all"
                    />
                  </Link>

                  <Link
                    href="/events"
                    className="group flex items-center gap-4 p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-black/30 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-bold text-lg mb-1">大会情報を見る</h3>
                      <p className="text-white/70 text-sm">最新のトライアスロン大会情報</p>
                    </div>
                    <ArrowRight
                      size={20}
                      className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all"
                    />
                  </Link>

                  <Link
                    href="/columns"
                    className="group flex items-center gap-4 p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-black/30 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-bold text-lg mb-1">コラムを読む</h3>
                      <p className="text-white/70 text-sm">役立つトライアスロン情報を発信</p>
                    </div>
                    <ArrowRight
                      size={20}
                      className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="text-center animate-fade-in-up">
              <h2 className="heading-2 text-white mb-8 japanese-text">コミュニティに参加しよう</h2>
              <p className="body-large text-white/95 mb-12 leading-relaxed">
                沖縄の美しい自然の中で、一緒にトレーニングを楽しみましょう。
                <br />
                初心者から上級者まで、みんなが楽しめるコミュニティです。
                <br />
                今すぐ私たちの仲間になって、素晴らしいトライアスロンライフを始めましょう！
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
                <Link
                  href="/board"
                  className="w-full sm:w-48 bg-white text-blue-600 hover:bg-white/90 px-6 py-4 text-lg font-bold shadow-2xl rounded-xl transition-all duration-300 text-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    掲示板で交流する
                    <Users size={20} />
                  </span>
                </Link>
                <Link
                  href="/events"
                  className="w-full sm:w-48 bg-black/20 backdrop-blur-md text-white border border-white/40 hover:bg-black/30 px-6 py-4 text-lg font-bold shadow-2xl rounded-xl transition-all duration-300 text-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Calendar size={20} />
                    大会情報を見る
                  </span>
                </Link>
                <Link
                  href="/columns"
                  className="w-full sm:w-48 bg-black/20 backdrop-blur-md text-white border border-white/40 hover:bg-black/30 px-6 py-4 text-lg font-bold shadow-2xl rounded-xl transition-all duration-300 text-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    <BookOpen size={20} />
                    コラムを読む
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
