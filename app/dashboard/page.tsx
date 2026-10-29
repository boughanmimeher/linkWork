
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string;
  role: "client" | "freelancer";
};

type Project = {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("Loading your dashboard...");
  const [projectMessage, setProjectMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        setMessage(
          profileError
            ? "Couldn't load your profile. Please try again."
            : "Your account exists, but its profile hasn't been created yet."
        );
        return;
      }

      setProfile(profileData as Profile);
      setMessage("");

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, description, budget, status, created_at")
        .eq("client_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (projectError) {
        setProjectMessage("Couldn't load your projects. Please refresh.");
        return;
      }

      setProjects((projectData ?? []) as Project[]);
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Unable to sign out. Please try again.");
      return;
    }

    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <a href="/" className="text-2xl font-bold text-blue-700">
          LinkWork
        </a>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto mt-12 max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        {profile ? (
          <>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
              {profile.role}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome, {profile.full_name || "LinkWork member"}!
            </h1>

            <p className="mt-3 text-slate-600">
              Welcome to your LinkWork workspace.
            </p>

            <div className="mt-8 rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Your projects
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage the projects you've posted.
                  </p>
                </div>

                {profile.role === "client" && (
                  <a
                    href="/projects/new"
                    className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
                  >
                    + Post a project
                  </a>
                )}
              </div>

              {projectMessage && (
                <p role="status" className="mt-4 text-sm text-red-700">
                  {projectMessage}
                </p>
              )}

              {!projectMessage && projects.length === 0 && (
                <div className="mt-5 rounded-lg bg-slate-50 p-5">
                  <p className="font-medium text-slate-800">
                    No projects yet
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {profile.role === "client"
                      ? "Post your first project to get started."
                      : "Projects you create as a client will appear here."}
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">
                        {project.title}
                      </h3>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-800">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {project.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="font-semibold text-slate-900">
                        Budget: {Number(project.budget).toLocaleString()}
                      </p>
                      <p className="text-slate-500">
                        Posted{" "}
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">Your messages</h2>
              <p className="mt-2 text-sm text-slate-600">
                Client-freelancer messaging is a feature we'll build next.
              </p>
            </div>
          </>
        ) : (
          <p role="status" className="text-slate-700">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
