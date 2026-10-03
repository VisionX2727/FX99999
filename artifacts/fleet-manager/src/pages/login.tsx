import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { LogIn, ShieldCheck } from "lucide-react";
import fleetXLogo from "@assets/FleetX_1785676635299.jpeg";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
      <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z" />
      <path fill="#FBBC05" d="M6.54 13.58a5.85 5.85 0 0 1 0-3.16V7.89H3.3a9.5 9.5 0 0 0 0 8.22l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.47 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z" />
    </svg>
  );
}

export default function Login({ adminOnly = false }: { adminOnly?: boolean }) {
  const { signInWithGoogle, signingIn, authError } = useAuth();
  const showCallbackBrowserHelp = Boolean(authError && /(callback|code verifier|sign-in verifier|pkce|flow_state|sign-in state)/i.test(authError));
  const showSupabaseConfigHelp = Boolean(authError && /missing a valid supabase url or publishable key/i.test(authError));
  const showOAuthHelp = Boolean(
    authError &&
    !showCallbackBrowserHelp &&
    !showSupabaseConfigHelp &&
    /(could not reach supabase|oauth configuration|not allowed by supabase|not fully configured in supabase|publishable key configured)/i.test(authError),
  );
  const isEmbeddedPreview = window.self !== window.top;
  const appRedirectUrl = new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="text-center">
          <img src={fleetXLogo} alt="Fleetvix logo" className="fm-login-logo" />
           <h1 className="text-3xl font-black tracking-tight text-foreground">Fleetvix</h1>
          <p className="text-muted-foreground mt-2 font-medium">Run your vehicles, work logs, drivers and accounts from one place.</p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>

          <div className="flex items-start gap-4 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">{adminOnly ? "Admin sign in" : "Sign in to continue"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                {adminOnly
                  ? "Authorized administrators can manage Fleetvix support and accounts."
                  : "Sign in with your Google account to open your Fleetvix workspace."}
              </p>
            </div>
          </div>

          {isEmbeddedPreview && (
            <p className="mb-4 mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
              Google sign-in can lose its browser state inside an embedded preview.{" "}
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-2">
                Open FleetX in a new tab
              </a>{" "}
              and sign in there.
            </p>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full bg-primary text-primary-foreground rounded-2xl p-4 font-bold flex items-center justify-center gap-3 disabled:opacity-60 active:scale-[.98] transition-all hover:bg-primary/90 shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
          >
             <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white"><GoogleMark /></span>
            {signingIn ? "Opening Google..." : "Continue with Google"}
            <LogIn size={18} className="ml-1" />
          </button>

          {authError && (
             <div role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm font-medium">
              {authError}
                {showSupabaseConfigHelp && (
                  <div className="mt-3 space-y-2 text-xs opacity-90">
                    <p>For the Vercel deployment, set these variables in the Production environment, then redeploy:</p>
                    <code className="block rounded-lg bg-black/20 p-2">VITE_SUPABASE_URL</code>
                    <code className="block rounded-lg bg-black/20 p-2">VITE_SUPABASE_PUBLISHABLE_KEY</code>
                  </div>
                )}
                {showCallbackBrowserHelp && (
                  <div className="mt-3 space-y-2 text-xs opacity-90">
                    <p>This is a browser-session error, not a restriction on ordinary Gmail accounts. If this page opened inside another app, open the URL below directly in Chrome or your full browser, then start a fresh sign-in and stay in that browser.</p>
                    <code className="block break-all rounded-lg bg-black/20 p-2 select-all">{appRedirectUrl}</code>
                  </div>
                )}
               {showOAuthHelp && (
                 <div className="mt-3 space-y-2 text-xs opacity-90">
                   <p>Enable Google in Supabase Authentication → Providers and enter the Google OAuth client credentials there. In Google Cloud, register the callback URL shown in the Supabase Google provider settings.</p>
                   <p>Add this exact URL under Supabase Authentication → URL Configuration → Redirect URLs:</p>
                   <code className="block break-all rounded-lg bg-black/20 p-2 select-all">{appRedirectUrl}</code>
                 </div>
              )}
            </div>
          )}

            <p className="text-[11px] text-muted-foreground text-center mt-6">{adminOnly ? <Link href="/" className="underline underline-offset-4">Back to Fleetvix sign in</Link> : <>Only your signed-in account can access its fleet workspace. <Link href="/admin" className="ml-1 underline underline-offset-4">Admin sign in</Link></>}</p>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center font-bold mt-4 uppercase tracking-[0.15em]">
          Rugged • Trusted • Field Ready
        </p>
      </div>
    </main>
  );
}
