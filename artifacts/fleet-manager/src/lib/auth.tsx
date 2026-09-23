import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseAuthStorageKey, supabaseConfigured } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const MINIMUM_SPLASH_MS = 1200;
const AUTH_BOOTSTRAP_TIMEOUT_MS = 6000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("Supabase auth initialization timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

function getCallbackError() {
  const queryError = new URLSearchParams(window.location.search).get("error_description");
  const hashError = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("error_description");
  return queryError || hashError;
}

function formatAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Fleetvix could not reach Supabase. Check the Vercel environment variables and try again.";
  }
  if (normalized.includes("redirect") && normalized.includes("not allowed")) {
    return "This website URL is not allowed by Supabase. Add the deployed Vercel URL to Supabase Authentication → URL Configuration → Redirect URLs.";
  }
  if (normalized.includes("provider") && normalized.includes("not enabled")) {
    return "Google sign-in is not enabled in Supabase. Enable Google under Authentication → Providers.";
  }
  if (normalized.includes("invalid api key") || normalized.includes("apikey")) {
    return "The Supabase publishable key configured for this deployment is invalid.";
  }
  if (normalized.includes("oauth state") || normalized.includes("flow_state")) {
    return "Google sign-in expired before it returned to the app. Please choose your Google account again.";
  }
  if (normalized.includes("code verifier") || normalized.includes("pkce")) {
    return "This Google sign-in attempt could not be verified. Please choose your Google account again.";
  }
  if (normalized.includes("timed out")) {
    return "Fleetvix could not finish checking your session. Check your Supabase URL and network connection, then try again.";
  }
  return message;
}

function clearOAuthCallbackParams() {
  const url = new URL(window.location.href);
  const callbackParams = [
    "code",
    "state",
    "error",
    "error_code",
    "error_description",
    "sb_flow_id",
    "access_token",
    "refresh_token",
    "expires_in",
    "expires_at",
    "token_type",
    "type",
  ];
  callbackParams.forEach((param) => url.searchParams.delete(param));
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    if (["access_token", "refresh_token", "error", "error_description", "expires_in", "expires_at", "token_type", "type"].some((param) => hashParams.has(param))) {
      url.hash = "";
    }
  }
  window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function clearPendingPkceVerifiers() {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (
      key === `${supabaseAuthStorageKey}-code-verifier` ||
      key === `${supabaseAuthStorageKey}-flows-code-verifier` ||
      key?.startsWith(`${supabaseAuthStorageKey}-flow-`)
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function getRedirectUrl() {
  const basePath = import.meta.env.BASE_URL || "/";
  return new URL(basePath, window.location.origin).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthError("Supabase authentication is not configured for this app.");
      setLoading(false);
      return;
    }

    let mounted = true;
    const authStartedAt = Date.now();
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setSigningIn(false);
       if (nextSession) setAuthNotice(null);
      if (event === "SIGNED_OUT") setAuthError(null);
    });

    const finishAuthInitialization = async () => {
      const callbackError = getCallbackError();
      if (callbackError) {
        setAuthError(decodeURIComponent(callbackError.replace(/\+/g, " ")));
        clearOAuthCallbackParams();
      }

      try {
        const code = new URL(window.location.href).searchParams.get("code");
        if (code && !callbackError) {
          // Exchange exactly once, after the auth listener is registered. This
          // consumes the PKCE verifier created for this browser login attempt.
          const { data, error } = await withTimeout(supabase.auth.exchangeCodeForSession(code), AUTH_BOOTSTRAP_TIMEOUT_MS);
          if (error) throw error;
          if (mounted) setSession(data.session);
          clearOAuthCallbackParams();
        }

        const { data, error } = await withTimeout(supabase.auth.getSession(), AUTH_BOOTSTRAP_TIMEOUT_MS);
        if (!mounted) return;
        if (error) throw error;
        setSession(data.session);
      } catch (error) {
        if (!mounted) return;
        setAuthError(formatAuthError(error));
        clearOAuthCallbackParams();
        setSession(null);
      } finally {
        const remainingSplashTime = Math.max(0, MINIMUM_SPLASH_MS - (Date.now() - authStartedAt));
        window.setTimeout(() => {
          if (mounted) setLoading(false);
        }, remainingSplashTime);
      }
    };

    void finishAuthInitialization();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    session,
    loading,
    authError,
    authNotice,
    signingIn,
    signInWithGoogle: async () => {
      if (!supabaseConfigured) {
        setAuthError("Supabase authentication is not configured for this app.");
        return;
      }
      setAuthError(null);
      setAuthNotice(null);
      setSigningIn(true);
      clearOAuthCallbackParams();
      clearPendingPkceVerifiers();
      const redirectTo = getRedirectUrl();
       try {
         const { error } = await supabase.auth.signInWithOAuth({
           provider: "google",
           options: {
             redirectTo,
             // Always let the user choose Gmail A or Gmail B instead of reusing
             // the currently active Google browser account.
             queryParams: { prompt: "select_account" },
           },
         });
         if (error) throw error;
       } catch (error) {
         setAuthError(formatAuthError(error));
        setSigningIn(false);
      }
    },
    signInWithPassword: async (email: string, password: string) => {
      if (!supabaseConfigured) {
        setAuthError("Supabase authentication is not configured for this app.");
        return;
      }
      setAuthError(null);
      setAuthNotice(null);
      setSigningIn(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setSession(data.session);
      } catch (error) {
        setAuthError(formatAuthError(error));
      } finally {
        setSigningIn(false);
      }
    },
    signUpWithPassword: async (email: string, password: string) => {
      if (!supabaseConfigured) {
        setAuthError("Supabase authentication is not configured for this app.");
        return;
      }
      setAuthError(null);
      setAuthNotice(null);
      setSigningIn(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getRedirectUrl() },
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
        } else {
          setAuthNotice("Account created. Check your email to confirm the account, then sign in.");
        }
      } catch (error) {
        setAuthError(formatAuthError(error));
      } finally {
        setSigningIn(false);
      }
    },
    signOut: async () => {
      // A local logout clears this browser's Supabase session and PKCE
      // verifier without revoking other sessions for the same user.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      clearPendingPkceVerifiers();
      setAuthNotice(null);
      return { error: error ? new Error(error.message) : null };
    },
  }), [session, loading, authError, authNotice, signingIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}