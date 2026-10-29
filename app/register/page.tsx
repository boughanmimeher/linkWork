
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            full_name: fullName.trim(),
            role,
          });

        if (profileError) throw profileError;

        setMessage("Account created successfully! You can now sign in.");
      } else {
        setMessage(
          "Registration received! Check your email to confirm your account before signing in."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm"
      >
        <a href="/" className="text-sm text-blue-700">
          ← Back to LinkWork
        </a>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Join LinkWork
          </h1>
          <p className="mt-2 text-slate-600">
            Create your client or freelancer account.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Full name
          <input
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="Your full name"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            required
            type="email"
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
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="At least 8 characters"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            I want to join as a
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "client", label: "Client" },
              { value: "freelancer", label: "Freelancer" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={`rounded-lg border p-3 ${
                  role === option.value
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {message && (
          <p role="status" aria-live="polite" className="break-words text-sm text-slate-700">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-slate-600">
          Already registered?{" "}
          <a href="/login" className="font-medium text-blue-700">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
