import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";

// X (旧Twitter) アイコンコンポーネント
const XIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const navigation = {
  main: [
    { name: "ホーム", href: "/" },
    { name: "掲示板", href: "/board" },
    { name: "大会情報", href: "/events" },
    { name: "コラム", href: "/columns" },
    { name: "カフェ", href: "/cafes" },
    { name: "コース", href: "/courses" },
    { name: "ギャラリー", href: "/gallery" },
    { name: "ギアレビュー", href: "/gear" },
  ],
  social: [
    {
      name: "Facebook",
      href: "#",
      icon: Facebook,
    },
    {
      name: "X",
      href: "#",
      icon: XIcon,
    },
    {
      name: "Instagram",
      href: "#",
      icon: Instagram,
    },
  ],
  support: [
    { name: "よくある質問", href: "/faq" },
    { name: "お問い合わせ", href: "/contact" },
    { name: "プライバシーポリシー", href: "/privacy" },
    { name: "利用規約", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800 dark:border-gray-700">
      <div>
        {/* Main Footer Content */}
        <div className="container-premium section-spacing">
          {/* PC Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
              {/* Left Column - Brand Section */}
              <div>
                <Link href="/" className="flex items-center space-x-4 mb-8 group">
                  <div className="relative">
                    <div className="w-18 h-18 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
                      <img src="/logo.svg" alt="沖縄トライアスロンコミュニティ" className="w-12 h-12" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-white japanese-text">沖縄トライアスロン</span>
                    <div className="text-sm text-white/70 font-semibold tracking-wider">
                      OKINAWA TRIATHLON COMMUNITY
                    </div>
                  </div>
                </Link>

                <p className="text-white/90 mb-10 text-lg leading-relaxed">
                  美しい沖縄の自然の中で、トライアスロンを通じて健康的なライフスタイルを推進し、
                  <br />
                  地域のコミュニティづくりに貢献します。
                </p>
              </div>

              {/* Right Column - Navigation Grid */}
              <div>
                <div className="grid grid-cols-2 gap-12">
                  {/* Main Navigation */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-8 japanese-text">メニュー</h4>
                    <ul className="space-y-4">
                      {navigation.main.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="text-white hover:text-blue-400 transition-all duration-300 hover:translate-x-2 inline-block japanese-text font-medium"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Support */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-8 japanese-text">サポート</h4>
                    <ul className="space-y-4">
                      {navigation.support.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="text-white hover:text-blue-400 transition-all duration-300 hover:translate-x-2 inline-block japanese-text font-medium"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 gap-12">
              {/* Brand Section */}
              <div>
                <Link href="/" className="flex items-center space-x-4 mb-8 group">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
                      <img src="/logo.svg" alt="沖縄トライアスロンコミュニティ" className="w-10 h-10" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white japanese-text">沖縄トライアスロン</span>
                    <div className="text-xs text-white/70 font-semibold tracking-wider">
                      OKINAWA TRIATHLON COMMUNITY
                    </div>
                  </div>
                </Link>

                <p className="text-white/90 mb-8 text-base leading-relaxed">
                  美しい沖縄の自然の中で、 トライアスロンを通じて健康的なライフスタイルを推進し、
                  地域のコミュニティづくりに貢献します。
                </p>
              </div>

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-8">
                {/* Main Navigation */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-6 japanese-text">メニュー</h4>
                  <ul className="space-y-3">
                    {navigation.main.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-white hover:text-blue-400 transition-all duration-300 inline-block japanese-text font-medium text-sm"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-6 japanese-text">サポート</h4>
                  <ul className="space-y-3">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-white hover:text-blue-400 transition-all duration-300 inline-block text-sm japanese-text"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20">
          <div className="container-premium py-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              {/* Copyright */}
              <div className="text-center lg:text-left">
                <p className="text-white/70 text-sm mb-3 font-medium">
                  © 2025 沖縄トライアスロンコミュニティ. All rights reserved.
                </p>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-6">
                <span className="text-white/70 text-sm font-medium">Follow us:</span>
                {navigation.social.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group w-12 h-12 bg-white/10 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  >
                    <item.icon size={20} className="text-white/70 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
