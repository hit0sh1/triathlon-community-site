export default function TermsOfServicePage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">利用規約</h1>
          <p className="text-xl opacity-90">
            サービス利用に関する規約
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
                第1条（適用）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                本利用規約（以下「本規約」）は、トライアスロンコミュニティ（以下「当サイト」）が提供する
                すべてのサービス（以下「本サービス」）の利用条件を定めるものです。
                ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第2条（利用登録）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>本サービスの利用を希望する者は、本規約に同意の上、当サイトの定める方法によって利用登録を申請するものとします。</li>
                <li>当サイトは、利用登録の申請者に対して、当サイトの基準に従って、利用登録の可否を決定し、これを申請者に通知します。</li>
                <li>利用登録が完了した場合、ユーザーと当サイトの間で本サービスの利用契約が成立するものとします。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第3条（アカウントの管理）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>ユーザーは、自己の責任において、本サービスのアカウント情報を適切に管理するものとします。</li>
                <li>ユーザーは、いかなる場合にも、アカウント情報を第三者に譲渡または貸与することはできません。</li>
                <li>アカウント情報の管理不十分、使用上の過誤、第三者の使用等によって生じた損害の責任は、ユーザーが負うものとします。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第4条（禁止事項）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当サイト、他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>当サイトのサービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>当サイトのサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>その他、当サイトが不適切と判断する行為</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第5条（本サービスの提供の停止等）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当サイトが本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第6条（利用制限および登録抹消）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、ユーザーが以下のいずれかに該当する場合、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>料金等の支払債務の不履行があった場合</li>
                <li>当サイトからの連絡に対し、一定期間返答がない場合</li>
                <li>本サービスについて、最後の利用から一定期間利用がない場合</li>
                <li>その他、当サイトが本サービスの利用を適当でないと判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第7条（退会）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                ユーザーは、当サイトの定める退会手続により、本サービスから退会できるものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第8条（保証の否認および免責事項）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>当サイトは、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。</li>
                <li>当サイトは、本サービスに起因してユーザーに生じたあらゆる損害について、一切の責任を負いません。</li>
                <li>前項ただし書に定める場合であっても、当サイトは、過失（重過失を除く。）による行為により、ユーザーに生じた損害が当サイトに直接起因する場合を除き、一切の責任を負いません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第9条（サービス内容の変更等）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第10条（利用規約の変更）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第11条（個人情報の取扱い）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                当サイトは、本サービスの利用によって取得する個人情報については、当サイト「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第12条（通知または連絡）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                ユーザーと当サイトとの間の通知または連絡は、当サイトの定める方法によって行うものとします。当サイトは、ユーザーから、当サイトが別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第13条（権利義務の譲渡の禁止）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                ユーザーは、当サイトの書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                第14条（準拠法・裁判管轄）
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当サイトの本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                お問い合わせ
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                  本規約に関するお問い合わせは、以下までご連絡ください：
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  トライアスロンコミュニティ<br />
                  メール: legal@triathlon-community.jp<br />
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