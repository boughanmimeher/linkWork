
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [message, setMessage] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setMessage("We couldn't load your profile. Please try again.");
      } else if (profile.role !== "client") {
        setMessage("Only client accounts can post projects.");
      } else {
        setClientId(data.user.id);
      }

      setCheckingUser(false);
    }

    checkUser();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!clientId) {
      setMessage("A client account is required to post a project.");
      return;
    }

    const amount = Number(budget);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid budget greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("projects").insert({
        client_id: clientId,
        title: title.trim(),
        description: description.trim(),
        budget: amount,
      });

      if (error) throw error;

      setMessage("Project posted successfully!");
      setTitle("");
      setDescription("");
      setBudget("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Couldn't post your project. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingUser) {
    return <main className="p-8 text-slate-700">Checking your account...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="text-sm font-medium text-blue-700">
          ← Back to dashboard
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Post a project
            </h1>
            <p className="mt-2 text-slate-600">
              Describe the work and set your budget.
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-800">
            Project title
            <input
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a business website"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Project description
            <textarea
              required
              minLength={20}
              maxLength={5000}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the work, deliverables and requirements..."
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Budget
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 500"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Enter an amount in your chosen currency. Currency selection will be added later.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !clientId}
            className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish project"}
          </button>

          {message && (
            <p role="status" aria-live="polite" className="text-sm text-slate-700">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
