import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

/**
 * Middleware から呼ばれて、Supabase のセッションを毎リクエストで更新する。
 *
 * Next.js の Middleware は Edge Runtime で動作し、すべてのリクエストの前段で実行される。
 * ここで Cookie に保存されたセッションをリフレッシュしておくことで、
 * Server Component / Server Action / Route Handler から取得した user が常に最新になる。
 *
 * また、認証必須ページへの未ログインアクセスをここでリダイレクトする。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 重要: createServerClient と getUser() の間に他のロジックを挟まない。
  // セッションがランダムに切れる原因になる（Supabase 公式の警告）。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 認証が不要な公開ページ
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/about",
    "/terms",
    "/privacy",
  ];

  // ツアー一覧・詳細はプレビュー閲覧可（申込時にログイン要求）
  const publicPrefixes = ["/tours"];

  const isPublic =
    publicPaths.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/stripe/webhook"); // Webhook は認証不要

  // 未ログイン & 非公開ページ → ログインへ
  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 管理者ページの保護
  if (pathname.startsWith("/admin")) {
    const role = user?.user_metadata?.role;
    if (role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
