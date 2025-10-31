import { NextRequest, NextResponse } from 'next/server'

// PHPのセッション状態を検証し、未ログインならPHPログインへリダイレクト
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()

  // 静的アセットなどはスキップ
  const publicPrefixes = ['/_next', '/favicon.ico', '/public']
  if (publicPrefixes.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const phpValidateUrl = 'http://localhost/AI-chatbot/root/validate_session.php'

  try {
    const cookieHeader = req.headers.get('cookie') || ''

    // セッションCookieが存在しない場合は即ログインへ
    const hasPhpSess = /PHPSESSID=/i.test(cookieHeader)
    if (!hasPhpSess) {
      // ゲスト利用（?guest=1）はこのときだけ通す（Cookieでは保持しない）
      const guestParam = url.searchParams.get('guest') === '1'
      if (guestParam) {
        return NextResponse.next()
      }
      const registerUrl = new URL('http://localhost/AI-chatbot/root/register.php')
      registerUrl.searchParams.set('next', url.toString())
      return NextResponse.redirect(registerUrl)
    }

    // 既に認証済みフラグがあれば検証をスキップ（ただしPHPSESSIDがある場合のみ）
    const alreadyAuthed = req.cookies.get('chat_auth')?.value === '1'
    if (alreadyAuthed) {
      return NextResponse.next()
    }
    const resp = await fetch(phpValidateUrl, {
      method: 'GET',
      headers: {
        // ブラウザから届いたCookie（PHPSESSID含む）をそのまま転送
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!resp.ok) {
      // 失敗時はログイン/登録へ
      const registerUrl = new URL('http://localhost/AI-chatbot/root/register.php')
      registerUrl.searchParams.set('next', url.toString())
      const r = NextResponse.redirect(registerUrl)
      // 認証フラグを消す
      r.cookies.set('chat_auth', '', { path: '/', maxAge: 0 })
      return r
    }

    const data = (await resp.json().catch(() => ({}))) as {
      loggedIn?: boolean
      user?: { id?: number | null; name?: string | null }
    }

    if (!data?.loggedIn) {
      const registerUrl = new URL('http://localhost/AI-chatbot/root/register.php')
      registerUrl.searchParams.set('next', url.toString())
      const r = NextResponse.redirect(registerUrl)
      r.cookies.set('chat_auth', '', { path: '/', maxAge: 0 })
      return r
    }

    // 認証OK
    const res = NextResponse.next()
    // 必要ならユーザー名をヘッダーに伝播（サーバーコンポーネントで参照可能）
    if (data.user?.name) {
      res.headers.set('x-user-name', String(data.user.name))
    }
    // 簡易認証フラグCookie（5分）で以後の検証をスキップしてリダイレクト抑制
    res.cookies.set('chat_auth', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 300,
    })
    return res
  } catch (e) {
    const registerUrl = new URL('http://localhost/AI-chatbot/root/register.php')
    registerUrl.searchParams.set('next', url.toString())
    const r = NextResponse.redirect(registerUrl)
    r.cookies.set('chat_auth', '', { path: '/', maxAge: 0 })
    return r
  }
}

export const config = {
  matcher: [
    // 静的ファイル等を除き、基本全ページで認証チェック
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
