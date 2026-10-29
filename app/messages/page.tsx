
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  title: string;
  client_id: string;
  selected_freelancer_id: string | null;
  status: string;
};

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjects() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.href = "/login";
        return;
      }

      const currentUserId = authData.user.id;
      setUserId(currentUserId);

      const { data, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, client_id, selected_freelancer_id, status")
        .eq("status", "in_progress")
        .or(
          `client_id.eq.${currentUserId},selected_freelancer_id.eq.${currentUserId}`
        )
        .order("created_at", { ascending: false });

      if (projectsError) {
        setError(projectsError.message);
      } else {
        const availableProjects = (data ?? []) as Project[];
        setProjects(availableProjects);
        if (availableProjects.length > 0) {
          setSelectedProjectId(availableProjects[0].id);
        }
      }

      setLoading(false);
    }

    loadProjects();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedProjectId) {
        setMessages([]);
        return;
      }

      setError("");

      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("id, project_id, sender_id, content, created_at")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        setError(messagesError.message);
      } else {
        setMessages((data ?? []) as Message[]);
      }
    }

    loadMessages();
  }, [selectedProjectId]);
  
  useEffect(() => {
    if (!selectedProjectId) return;

    const channel = supabase
      .channel(`messages-${selectedProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${selectedProjectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((previous) => {
            if (previous.some((message) => message.id === newMessage.id)) {
              return previous;
            }

            return [...previous, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedProjectId]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || !selectedProjectId || sending) return;

    setSending(true);
    setError("");
    setNotice("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Your session has expired. Please log in again.");
      setSending(false);
      return;
    }

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        project_id: selectedProjectId,
        sender_id: authData.user.id,
        content: trimmedContent,
      })
      .select("id, project_id, sender_id, content, created_at")
      .single();

    if (sendError) {
      setError(sendError.message);
    } else if (data) {
      setMessages((previous) => [...previous, data as Message]);
      setContent("");
      setNotice("Message sent.");
    }

    setSending(false);
  }

  if (loading) {
    return <main className="p-8">Loading messages...</main>;
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="mb-2 text-3xl font-bold">Messages</h1>
      <p className="mb-6 text-gray-600">
        Chat with the other participant in your project.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      {notice && (
        <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
          {notice}
        </p>
      )}

      {projects.length === 0 ? (
        <section className="rounded-xl border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            No active conversations yet
          </h2>
          <p className="text-gray-600">
            Messaging becomes available when a client accepts a freelancer
            and the project moves to In Progress.
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block font-medium text-blue-600 hover:underline"
          >
            Return to dashboard
          </a>
        </section>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border p-4">
            <h2 className="mb-3 font-semibold">Your projects</h2>

            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    selectedProjectId === project.id
                      ? "border-blue-600 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="block font-medium">{project.title}</span>
                  <span className="text-sm text-gray-500">
                    In Progress
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[480px] flex-col rounded-xl border">
            <div className="border-b p-4">
              <h2 className="font-semibold">
                {projects.find((p) => p.id === selectedProjectId)?.title}
              </h2>
              <p className="text-sm text-gray-500">
                Project conversation
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === userId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            isMine ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t p-4">
              <label htmlFor="message" className="mb-2 block font-medium">
                Your message
              </label>
              <div className="flex gap-2">
                <input
                  id="message"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={5000}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
