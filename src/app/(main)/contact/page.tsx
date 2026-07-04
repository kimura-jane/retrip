import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "お問い合わせ | Re:Trip",
  description:
    "Re:Trip へのお問い合わせフォーム。サービス、予約、決済、アカウント等に関するご相談を承ります。",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Contact
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            お問い合わせ
          </h1>
          <p className="mt-6 text-[13px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            ご質問・ご相談・ご要望など、お気軽にお寄せください。
            <br className="hidden sm:block" />
            通常2〜3営業日以内にご返信いたします。
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-6 lg:px-10">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
