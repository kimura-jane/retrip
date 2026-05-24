import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, MessageCircle, Sparkles, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ===== ヘッダー ===== */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-widest">
            Re:Trip
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
            <Button asChild size="sm" className="bg-brand-400 text-white hover:bg-brand-600">
              <Link href="/signup">新規登録</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ===== ヒーロー ===== */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* 背景画像 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
            alt="山と空"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/40 to-white/90" />
        </div>

        {/* テキスト */}
        <div className="container relative z-10 text-center animate-fade-in">
          <p className="mb-6 text-sm tracking-[0.3em] text-brand-700">— Re:Trip —</p>
          <h1 className="heading-poetic mb-8 text-foreground">
            知らない誰かと、
            <br />
            知らない景色へ。
          </h1>
          <p className="mx-auto mb-12 max-w-xl text-airy text-base text-muted-foreground md:text-lg">
            関東発、少人数のバスツアー。
            <br />
            出発前から、もう旅は始まっている。
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-brand-400 px-8 text-white hover:bg-brand-600"
            >
              <Link href="/signup">
                新規登録
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand-400 px-8 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>

        {/* スクロール示唆 */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <div className="h-12 w-px bg-foreground/30" />
        </div>
      </section>

      {/* ===== コンセプト ===== */}
      <section className="section-padding bg-background">
        <div className="container max-w-3xl text-center">
          <p className="mb-6 text-sm tracking-[0.3em] text-brand-600">CONCEPT</p>
          <h2 className="heading-poetic mb-12">
            旅は、出発前から
            <br />
            はじまっている。
          </h2>
          <div className="text-airy space-y-6 text-muted-foreground">
            <p>
              バスに乗り込む、その日まで。
              <br />
              少しずつ言葉を交わし、人を知り、景色を想う。
            </p>
            <p>
              Re:Trip は、関東発の少人数バスツアー。
              <br />
              決済を済ませた瞬間から、専用チャットで仲間と出会えます。
            </p>
            <p>
              当日は、知らない誰かと同じ景色を分け合って。
              <br />
              旅が終わっても、関係は続いていく。
            </p>
          </div>
        </div>
      </section>

      {/* ===== 特徴3つ ===== */}
      <section className="section-padding bg-brand-50/40">
        <div className="container">
          <div className="mb-16 text-center">
            <p className="mb-6 text-sm tracking-[0.3em] text-brand-600">FEATURES</p>
            <h2 className="heading-poetic">Re:Trip の小さな約束</h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-8 w-8" strokeWidth={1.5} />}
              title="少人数編成"
              description="6〜12名の小さな旅。一人ひとりと、ちゃんと向き合える距離感で。"
            />
            <FeatureCard
              icon={<MessageCircle className="h-8 w-8" strokeWidth={1.5} />}
              title="事前チャット"
              description="決済後すぐに専用チャットへ。当日までに、もう知り合いになっている。"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" strokeWidth={1.5} />}
              title="続く関係性"
              description="旅が終わってもチャットとアルバムは残る。次の旅も、また一緒に。"
            />
          </div>
        </div>
      </section>

      {/* ===== ツアー例 ===== */}
      <section className="section-padding bg-background">
        <div className="container">
          <div className="mb-16 text-center">
            <p className="mb-6 text-sm tracking-[0.3em] text-brand-600">TOURS</p>
            <h2 className="heading-poetic">こんな旅、あります。</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <TourCard
              image="https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80"
              tag="婚活 3 × 3"
              destination="箱根・芦ノ湖"
              type="日帰り"
              title="湖畔のひととき"
            />
            <TourCard
              image="https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80"
              tag="友達作り"
              destination="伊豆・河津"
              type="1泊2日"
              title="海と桜と、温泉と"
            />
            <TourCard
              image="https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80"
              tag="男性限定"
              destination="秩父・長瀞"
              type="日帰り"
              title="川下りと焚き火飯"
            />
          </div>
        </div>
      </section>

      {/* ===== 流れ ===== */}
      <section className="section-padding bg-brand-50/40">
        <div className="container max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-6 text-sm tracking-[0.3em] text-brand-600">FLOW</p>
            <h2 className="heading-poetic">旅のはじめかた</h2>
          </div>

          <ol className="space-y-12">
            <FlowStep
              num="01"
              title="登録 ・ 本人確認"
              description="安心・安全のため、運営が本人確認書類を確認します。承認後、すべての機能が使えるようになります。"
            />
            <FlowStep
              num="02"
              title="ツアーを選んで申込"
              description="日帰り or 1泊2日、テーマやメンバー構成から、気になるツアーを選びます。"
            />
            <FlowStep
              num="03"
              title="決済 ・ 専用チャット参加"
              description="決済が完了すると、ツアー参加者だけの専用チャットに自動で参加。出発前から交流がはじまります。"
            />
            <FlowStep
              num="04"
              title="当日 ・ 旅へ"
              description="集合場所からバスで出発。少人数だから、自然と打ち解けて、本気で楽しめる。"
            />
            <FlowStep
              num="05"
              title="旅のあとも"
              description="ツアー後もチャットとアルバムは残ります。また会いたい人と、次の旅へ。"
            />
          </ol>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-padding bg-background">
        <div className="container max-w-2xl text-center">
          <h2 className="heading-poetic mb-8">
            最初の一歩を、
            <br />
            ここから。
          </h2>
          <p className="text-airy mb-12 text-muted-foreground">
            無料登録で、ツアーの詳細や仲間との出会いがはじまります。
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-brand-400 px-12 text-white hover:bg-brand-600"
            >
              <Link href="/signup">
                新規登録
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand-400 px-12 text-brand-700 hover:bg-brand-50"
            >
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== フッター ===== */}
      <footer className="border-t border-border/40 bg-background">
        <div className="container py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <p className="font-serif text-2xl tracking-widest">Re:Trip</p>
              <p className="mt-2 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Re:Trip. All rights reserved.
              </p>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/tours" className="hover:text-foreground">
                ツアー
              </Link>
              <Link href="/about" className="hover:text-foreground">
                運営について
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                プライバシー
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ===== 小さなコンポーネント ===== */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        {icon}
      </div>
      <h3 className="mb-4 font-serif text-2xl">{title}</h3>
      <p className="text-airy text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TourCard({
  image,
  tag,
  destination,
  type,
  title,
}: {
  image: string;
  tag: string;
  destination: string;
  type: string;
  title: string;
}) {
  return (
    <article className="group cursor-pointer overflow-hidden rounded-lg bg-card transition-all hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-brand-700">
          {tag}
        </span>
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {destination}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {type}
          </span>
        </div>
        <h3 className="font-serif text-xl">{title}</h3>
      </div>
    </article>
  );
}

function FlowStep({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description: string;
}) {
  return (
    <li className="grid gap-6 md:grid-cols-[auto,1fr] md:gap-12">
      <div className="font-serif text-5xl font-light text-brand-400">{num}</div>
      <div>
        <h3 className="mb-3 font-serif text-2xl">{title}</h3>
        <p className="text-airy text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
