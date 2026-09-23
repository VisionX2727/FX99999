import { useAuth } from "@/lib/auth";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { LogIn, ShieldCheck, Mail, LockKeyhole } from "lucide-react";
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
  const { signInWithGoogle, signInWithPassword, signUpWithPassword, signingIn, authError, authNotice } = useAuth();
  const [mode, setMode] = useState<"password" | "create">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "create") {
      await signUpWithPassword(email, password);
    } else {
      await signInWithPassword(email, password);
    }
  };

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
               <h2 className="font-bold text-foreground text-lg">{adminOnly ? "Admin sign in" : mode === "create" ? "Create your Fleetvix account" : "Sign in to continue"}</h2>
             <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{adminOnly ? "Authorized administrators can manage Fleetvix support and accounts." : "Keep your Fleetvix workspace synced with Google or email and password."}</p>
            </div>
          </div>

          <form onSubmit={(event) => void submitPassword(event)} className="space-y-3">
            <label className="fm-login-field"><Mail size={16} /> <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" /></label>
            <label className="fm-login-field"><LockKeyhole size={16} /> <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (at least 6 characters)" autoComplete={mode === "create" ? "new-password" : "current-password"} /></label>
            <button type="submit" disabled={signingIn} className="w-full rounded-2xl border border-primary/60 bg-primary/10 p-4 font-bold text-primary transition hover:bg-primary/20 disabled:opacity-60">
              {signingIn ? "Please wait..." : mode === "create" ? "Create account with email" : "Sign in with email"}
            </button>
          </form>

          {!adminOnly && <button type="button" onClick={() => setMode((current) => current === "password" ? "create" : "password")} className="mt-3 w-full text-sm font-bold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
             {mode === "create" ? "Already have an account? Sign in" : "New to Fleetvix? Create an account"}
          </button>}

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>

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

           {authNotice && <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">{authNotice}</div>}
          {authError && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm font-medium">
              {authError}
              {authError.toLowerCase().includes("provider") && (
                <p className="mt-2 text-xs opacity-80">Enable Google under Supabase → Authentication → Providers, then add this app URL under Redirect URLs.</p>
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
