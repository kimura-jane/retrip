import type { Metadata } from "next";
import {
  Noto_Sans_JP,
  Noto_Serif_JP,
  Zen_Maru_Gothic,
  Shippori_Mincho,
  Yusei_Magic,
} from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

// チャット用フォント（rounded）
const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen-maru-gothic",
  display: "swap",
});

// チャット用フォント（mincho）
const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-shippori-mincho",
  display: "swap",
});

// チャット用フォント（pop）
const yuseiMagic = Yusei_Magic({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-yusei-magic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "re trip | 知らない誰かと、知らない景色へ。",
    template: "%s | re trip",
  },
  description:
    "関東発の少人数バスツアー。決済後の専用チャットで事前に交流し、当日の旅で関係性を深める。日帰り〜1泊2日の小さな旅へ。",
  keywords: ["バスツアー", "日帰り旅行", "関東", "少人数", "出会い", "婚活", "友達作り"],
  openGraph: {
    title: "re trip | 知らない誰かと、知らない景色へ。",
    description:
      "関東発の少人数バスツアー。決済後の専用チャットで事前に交流し、当日の旅で関係性を深める。",
    type: "website",
    locale: "ja_JP",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${notoSerifJp.variable} ${zenMaruGothic.variable} ${shipporiMincho.variable} ${yuseiMagic.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
