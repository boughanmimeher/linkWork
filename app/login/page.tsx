
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm"
      >
        <a href="/" className="text-sm text-blue-700">
          ← Back to LinkWork
        </a>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-slate-600">
            Sign in to your LinkWork account.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="Your password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {message && (
          <p role="alert" className="break-words text-sm text-red-700">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-slate-600">
          New to LinkWork?{" "}
          <a href="/register" className="font-medium text-blue-700">
            Create an account
          </a>
        </p>
      </form>
    </main>
  );
}
