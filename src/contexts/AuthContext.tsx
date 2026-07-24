"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  tags: string[];
  is_builder: boolean;
  entry_count: number;
  // Extended profile fields
  builder_role?: string | null;
  currently_building?: string | null;
  pronouns?: string | null;
  custom_pronouns?: string | null;
  building_since?: number | null;
  github_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  is_public?: boolean;
  show_entry_count?: boolean;
  created_at?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGitHub: (next?: string) => Promise<void>;
  signInWithGoogle: (next?: string) => Promise<void>;
  signInWithMagicLink: (email: string, next?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref so the Realtime callback always reads the latest token
  // without needing to re-subscribe every time the session object changes.
  const sessionRef = useRef<Session | null>(null);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }

  // ── 1 & 2: Initial session + auth state listener ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      sessionRef.current = s;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        sessionRef.current = s;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          fetchProfile(s.user.id);

          // ── Single-session enforcement (magic link / email path) ──────────
          // OAuth logins (Google, GitHub) are stamped server-side in
          // /api/auth/callback immediately after exchangeCodeForSession.
          // Magic-link / email logins are stamped here on the client.
          // Fire-and-forget: do NOT await — this must not block auth resolution.
          if (event === "SIGNED_IN") {
            supabase
              .from("profiles")
              .update({ active_session_id: s.access_token })
              .eq("id", s.user.id);
          }
          // ─────────────────────────────────────────────────────────────────
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 3: Realtime session watcher ────────────────────────────────────────────
  // Subscribes to this user's profile row via Supabase Realtime.
  // When active_session_id changes (another login happened), compare it to
  // the local access_token. Mismatch → this tab/device has been superseded
  // → sign out immediately so the user is redirected to /login.
  //
  // PREREQUISITE: Enable Realtime on the `profiles` table in Supabase Dashboard
  //   → Database → Replication → toggle `profiles` on.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`session-guard:${user.id}`)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const incoming = payload.new as { active_session_id?: string | null };
          const myToken  = sessionRef.current?.access_token;

          if (
            incoming.active_session_id &&
            myToken &&
            incoming.active_session_id !== myToken
          ) {
            // Another session has taken over — kick this one out.
            supabase.auth.signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  // ────────────────────────────────────────────────────────────────────────────

  async function signInWithGitHub(next = "/dashboard") {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function signInWithGoogle(next = "/dashboard") {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function signInWithMagicLink(email: string, next = "/dashboard") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signInWithGitHub, signInWithGoogle, signInWithMagicLink, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
