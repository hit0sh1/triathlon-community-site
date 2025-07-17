export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">プライバシーポリシー</h1>
          <p className="text-xl opacity-90">
            個人情報の取り扱いについて
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                最終更新日: 2024年7月15日
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                1. 基本方針
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                トライアスロンコミュニティ（以下「当サイト」）は、ユーザーの皆様から取得する個人情報の重要性を認識し、
                個人情報の保護に関する法律、その他の関係法令等を遵守し、適切な取り扱いと保護に努めます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                2. 個人情報の定義
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項により定義された個人情報、
                すなわち生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
                特定の個人を識別することができるもの（他の情報と容易に照合することができ、それにより特定の個人を
                識別することができることとなるものを含む）を指します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                3. 個人情報の収集
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトでは、以下の場合に個人情報を収集することがあります：
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>ユーザー登録時</li>
                <li>お問い合わせ時</li>
                <li>イベント申し込み時</li>
                <li>コミュニティ機能の利用時</li>
                <li>その他、サービス提供に必要な場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                4. 収集する個人情報の種類
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトでは、以下の個人情報を収集する場合があります：
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>氏名</li>
                <li>メールアドレス</li>
                <li>電話番号</li>
                <li>住所</li>
                <li>生年月日</li>
                <li>プロフィール情報</li>
                <li>トレーニング記録</li>
                <li>その他、サービス提供に必要な情報</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                5. 個人情報の利用目的
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                収集した個人情報は、以下の目的で利用します：
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>サービスの提供・運営</li>
                <li>ユーザーサポート・お問い合わせ対応</li>
                <li>サービスの改善・開発</li>
                <li>イベント・大会の開催・運営</li>
                <li>重要なお知らせの配信</li>
                <li>利用規約違反の対応</li>
                <li>その他、サービス提供に必要な業務</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                6. 個人情報の第三者提供
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません：
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関等が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                7. 個人情報の管理
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、個人情報の漏洩、滅失、毀損等を防止するため、適切なセキュリティ対策を実施し、
                個人情報を安全に管理します。また、個人情報の取り扱いを委託する場合は、
                委託先に対して適切な管理を求めます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                8. Cookieについて
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトでは、ユーザーの利便性向上のためCookieを使用することがあります。
                Cookieとは、Webサイトがユーザーのコンピュータに送信する小さなデータファイルです。
                ブラウザの設定によりCookieを無効にすることも可能ですが、その場合、サービスの一部機能が
                利用できなくなる場合があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                9. 個人情報の開示・訂正・削除
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                ユーザーは、当サイトが保有する自己の個人情報について、開示、訂正、削除を求めることができます。
                これらの請求については、本人確認を行った上で、合理的な期間内に対応します。
                お問い合わせは、下記の連絡先までご連絡ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                10. プライバシーポリシーの変更
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、法令の変更等に伴い、本プライバシーポリシーを変更することがあります。
                重要な変更については、サイト上での告知その他適切な方法でユーザーに通知します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                11. お問い合わせ先
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                  個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  トライアスロンコミュニティ 個人情報保護担当<br />
                  メール: privacy@triathlon-community.jp<br />
                  電話: 03-1234-5678
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}