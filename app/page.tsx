
"use client";

import { useState } from "react";

type Project = {
  id: number;
  title: string;
  description: string;
  budget: number;
};

export default function Home() {
  const [role, setRole] = useState<"Client" | "Freelancer">("Freelancer");
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      title: "Industrial automation dashboard",
      description: "Build a dashboard for production KPIs.",
      budget: 450,
    },
    {
      id: 2,
      title: "AI customer support chatbot",
      description: "Develop a chatbot prototype for a small business.",
      budget: 800,
    },
    {
      id: 3,
      title: "Business website",
      description: "Create a responsive website for a new company.",
      budget: 300,
    },
  ]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("300");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  function publishProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !description.trim() || Number(budget) <= 0) {
      return;
    }

    setProjects((previous) => [
      {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
      },
      ...previous,
    ]);

    setTitle("");
    setDescription("");
    setBudget("300");
    setShowForm(false);
    setMessage("Your demo project has been published!");
  }

  const filtered = projects.filter((project) =>
    `${project.title} ${project.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 px-6 py-6 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              LinkWork<span className="text-blue-400">.</span>
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Better projects. Safer payments.
            </p>
          </div>
          <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">
            DEMO
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-2xl bg-blue-700 p-8 text-white">
          <h2 className="text-3xl font-bold">
            Work together with confidence.
          </h2>
          <p className="mt-3 max-w-xl text-blue-100">
            Find projects, connect with talent and protect every
            professional relationship with clear agreements.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {(["Freelancer", "Client"] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setRole(item);
                  setSelected(null);
                  setMessage("");
                }}
                className={`rounded-xl px-5 py-3 font-semibold ${
                  role === item
                    ? "bg-white text-blue-800"
                    : "border border-blue-300"
                }`}
              >
                {item} view
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">
            {role === "Freelancer" ? "Explore projects" : "Client dashboard"}
          </h2>

          {role === "Client" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              + Post a project
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={publishProject}
            className="mb-8 grid gap-4 rounded-2xl border bg-white p-6"
          >
            <h3 className="text-xl font-bold">Publish a project</h3>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="rounded-xl border p-3"
            />

            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the required work and deliverables"
              className="min-h-28 rounded-xl border p-3"
            />

            <input
              required
              type="number"
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget in EUR"
              className="rounded-xl border p-3"
            />

            <button className="rounded-xl bg-blue-700 p-3 font-semibold text-white">
              Publish project
            </button>
          </form>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="mb-6 w-full rounded-xl border bg-white p-4"
        />

        {message && (
          <p role="status" className="mb-5 rounded-xl bg-green-100 p-4 text-green-800">
            {message}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-bold">{project.title}</h3>
              <p className="mt-3 text-sm text-slate-600">
                {project.description}
              </p>
              <p className="my-5 text-2xl font-bold">€{project.budget}</p>

              <button
                onClick={() => setSelected(project)}
                className="w-full rounded-xl border border-blue-700 p-3 font-semibold text-blue-700"
              >
                View project
              </button>
            </article>
          ))}
        </div>

        {selected && (
          <section className="mt-8 rounded-2xl border border-blue-200 bg-white p-6">
            <h3 className="text-xl font-bold">{selected.title}</h3>
            <p className="mt-3">{selected.description}</p>
            <p className="mt-3 font-bold">Budget: €{selected.budget}</p>

            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Payment protection planned</strong>
              <p className="mt-2">
                The production version will connect to a payment provider.
                No money is collected or held by this demo.
              </p>
            </div>

            <button
              onClick={() => {
                setMessage(
                  "Demo only: proposals and payments are not connected yet."
                );
                setSelected(null);
              }}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-white"
            >
              {role === "Freelancer" ? "Express interest" : "Manage project"}
            </button>
          </section>
        )}

        <footer className="mt-12 border-t py-6 text-center text-sm text-slate-500">
          LinkWork © 2026 · Demo version
        </footer>
      </section>
    </main>
  );
}
