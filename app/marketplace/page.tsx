
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
};

export default function MarketplacePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedProjectIds, setAppliedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadMarketplace() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.href = "/login";
        return;
      }

      const user = authData.user;
      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setMessage("Unable to load your profile. Please try again.");
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      const { data, error } = await supabase
        .from("projects")
        .select("id, client_id, title, description, budget, status, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Unable to load projects. Please refresh and try again.");
        setLoading(false);
        return;
      }

      setProjects((data ?? []) as Project[]);

      if (profile.role === "freelancer") {
        const { data: applications } = await supabase
          .from("applications")
          .select("project_id")
          .eq("freelancer_id", user.id);

        setAppliedProjectIds(
          (applications ?? []).map((application) => application.project_id)
        );
      }

      setLoading(false);
    }

    loadMarketplace();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const term = search.toLowerCase().trim();

    return (
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term)
    );
  });

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject || !userId || userRole !== "freelancer") {
      setFormMessage("Only logged-in freelancer accounts can apply.");
      return;
    }

    const budget = Number(proposedBudget);

    if (!Number.isFinite(budget) || budget <= 0) {
      setFormMessage("Enter a valid proposed budget greater than zero.");
      return;
    }

    if (proposal.trim().length < 20 || proposal.trim().length > 3000) {
      setFormMessage("Your proposal must contain 20 to 3000 characters.");
      return;
    }

    setSubmitting(true);
    setFormMessage("");

    const { error } = await supabase.from("applications").insert({
      project_id: selectedProject.id,
      freelancer_id: userId,
      proposal: proposal.trim(),
      proposed_budget: budget,
    });

    setSubmitting(false);

    if (error) {
      setFormMessage(
        error.code === "23505"
          ? "You've already applied for this project."
          : "Your application couldn't be submitted. Please try again."
      );
      return;
    }

    setAppliedProjectIds((previous) => [...previous, selectedProject.id]);
    setSelectedProject(null);
    setProposal("");
    setProposedBudget("");
    setFormMessage("");
    alert("Your application was submitted successfully!");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <a href="/" className="text-2xl font-bold text-blue-700">
          LinkWork
        </a>

        <a
          href="/dashboard"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
        >
          Dashboard
        </a>
      </header>

      <section className="mx-auto mt-10 max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Explore projects
        </h1>

        <p className="mt-2 text-slate-600">
          Find projects and discover opportunities to work with clients.
        </p>

        {userRole === "client" && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            You're using a client account. Switch to a freelancer account to
            submit project applications.
          </p>
        )}

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project title or description..."
          className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />

        {loading ? (
          <p className="mt-8 text-slate-600">Loading projects...</p>
        ) : message ? (
          <p role="alert" className="mt-8 text-red-700">{message}</p>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="font-semibold text-slate-900">
              {search ? "No matching projects" : "No open projects yet"}
            </h2>
            <p className="mt-2 text-slate-600">
              {search
                ? "Try another search term."
                : "New client projects will appear here when they're posted."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {project.title}
                  </h2>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                    Open
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-slate-600">
                  {project.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-sm text-slate-500">Client budget</p>
                    <p className="text-lg font-bold text-slate-900">
                      {Number(project.budget).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    Posted {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                {userRole === "freelancer" && (
                  <div className="mt-4">
                    {appliedProjectIds.includes(project.id) ? (
                      <p className="font-medium text-green-700">
                        You've applied to this project
                      </p>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setFormMessage("");
                        }}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800"
                      >
                        Apply for this project
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="application-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Apply for project
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedProject.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  setFormMessage("");
                }}
                className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100"
                aria-label="Close application form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitApplication} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="proposal"
                  className="mb-1 block font-medium text-slate-800"
                >
                  Your proposal
                </label>
                <textarea
                  id="proposal"
                  required
                  minLength={20}
                  maxLength={3000}
                  rows={5}
                  value={proposal}
                  onChange={(event) => setProposal(event.target.value)}
                  placeholder="Explain how you would complete this project..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
                />
                <p className="mt-1 text-xs text-slate-500">
                  20–3000 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="proposedBudget"
                  className="mb-1 block font-medium text-slate-800"
                >
                  Your proposed budget
                </label>
                <input
                  id="proposedBudget"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={proposedBudget}
                  onChange={(event) => setProposedBudget(event.target.value)}
                  placeholder="Enter your price"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Currency selection will be added later.
                </p>
              </div>

              {formMessage && (
                <p role="alert" className="text-sm text-red-700">
                  {formMessage}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    setFormMessage("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
