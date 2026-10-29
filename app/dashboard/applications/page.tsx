
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  project_id: string;
  freelancer_id: string;
  freelancer_name: string;
  proposal: string;
  proposed_budget: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  project: {
    title: string;
    client_id: string;
  } | null;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setMessage("Unable to load your profile.");
        setLoading(false);
        return;
      }

      if (profile.role !== "client") {
        setMessage("This page is only available to clients.");
        setLoading(false);
        return;
      }

      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, client_id")
        .eq("client_id", authData.user.id);

      if (projectsError) {
        setMessage("Unable to load your projects.");
        setLoading(false);
        return;
      }

      const projectIds = (projects ?? []).map((project) => project.id);

      if (projectIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
  .from("applications")
  .select(
    "id, project_id, freelancer_id, proposal, proposed_budget, status, created_at"
  )
  .in("project_id", projectIds)
  .order("created_at", { ascending: false });

if (error) {
  setMessage("Unable to load applications. Please try again.");
  setLoading(false);
  return;
}

const freelancerIds = [
  ...new Set((data ?? []).map((application) => application.freelancer_id)),
];

let nameMap = new Map<string, string>();

if (freelancerIds.length > 0) {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", freelancerIds);

  if (profilesError) {
    setMessage("Unable to load freelancer names. Please try again.");
    setLoading(false);
    return;
  }

  nameMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name || "LinkWork Freelancer",
    ])
  );
}

const projectMap = new Map(
  (projects ?? []).map((project) => [project.id, project])
);

setApplications(
  (data ?? []).map((application) => ({
    ...application,
    freelancer_name:
      nameMap.get(application.freelancer_id) ?? "LinkWork Freelancer",
    project: projectMap.get(application.project_id) ?? null,
  })) as Application[]
);

setLoading(false);
    }

    loadApplications();
  }, []);

 
async function updateStatus(
  applicationId: string,
  status: "accepted" | "rejected"
) {
  setUpdatingId(applicationId);
  setMessage("");

  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      window.location.href = "/login";
      return;
    }

    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (
      !application ||
      application.project?.client_id !== authData.user.id
    ) {
      setMessage("You cannot manage this application.");
      return;
    }

    if (application.status !== "pending") {
      setMessage("This application has already been reviewed.");
      return;
    }

    if (status === "accepted") {
      const confirmed = window.confirm(
        "Accept this freelancer? The project will move to In Progress, and other pending applications will be rejected."
      );

      if (!confirmed) return;

      const { error } = await supabase.rpc(
        "accept_project_application",
        {
          p_application_id: applicationId,
        }
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setApplications((previous) =>
        previous.map((item) =>
          item.project_id === application.project_id &&
          item.status === "pending"
            ? {
                ...item,
                status:
                  item.id === applicationId
                    ? "accepted"
                    : "rejected",
              }
            : item
        )
      );
    } else {
  const { error } = await supabase.rpc(
    "reject_project_application",
    {
      p_application_id: applicationId,
    }
  );

  if (error) {
    setMessage(error.message);
    return;
  }

  setApplications((previous) =>
    previous.map((item) =>
      item.id === applicationId
        ? { ...item, status: "rejected" }
        : item
    )
  );
}
  } finally {
    setUpdatingId(null);
  }
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
          Project applications
        </h1>
        <p className="mt-2 text-slate-600">
          Review proposals submitted to your projects.
        </p>

        {loading ? (
          <p className="mt-8 text-slate-600">Loading applications...</p>
        ) : message && applications.length === 0 ? (
          <p role="status" className="mt-8 text-slate-700">{message}</p>
        ) : applications.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="font-semibold text-slate-900">
              No applications yet
            </h2>
            <p className="mt-2 text-slate-600">
              When freelancers apply to your projects, their proposals will
              appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Project</p>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {application.project?.title ?? "Project"}
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium capitalize text-slate-700">
                    {application.status}
                  </span>
                </div>

               <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">
                        Freelancer
                    </p>
                    <p className="mt-1 text-slate-900">
                        {application.freelancer_name}
                    </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700">
                    Proposal
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">
                    {application.proposal}
                  </p>
                </div>

                <p className="mt-4 font-semibold text-slate-900">
                  Proposed budget:{" "}
                  {Number(application.proposed_budget).toLocaleString()}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Applied{" "}
                  {new Date(application.created_at).toLocaleDateString()}
                </p>

                {application.status === "pending" && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={updatingId === application.id}
                      onClick={() =>
                        updateStatus(application.id, "accepted")
                      }
                      className="rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {updatingId === application.id
                        ? "Updating..."
                        : "Accept"}
                    </button>
                    <button
                      disabled={updatingId === application.id}
                      onClick={() =>
                        updateStatus(application.id, "rejected")
                      }
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {message && applications.length > 0 && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
