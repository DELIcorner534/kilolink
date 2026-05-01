"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type RealtimeChatProps = {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
  peerLabel?: string;
};

export function RealtimeChat({ bookingId, currentUserId, initialMessages, peerLabel = "Autre participant" }: RealtimeChatProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase]);

  const sendMessage = async () => {
    if (!draft.trim()) {
      return;
    }
    if (!supabase) {
      return;
    }

    setIsSending(true);
    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content: draft,
    });
    setDraft("");
    setIsSending(false);
  };

  return (
    <>
      <div className="space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">
              {message.sender_id === currentUserId ? "Vous" : peerLabel}
            </p>
            <p className="mt-1 text-slate-700">{message.content}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 p-3"
          placeholder="Ecrire un message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={isSending || !supabase}
          className="rounded-xl bg-[#0b1f4d] px-5 py-3 font-semibold !text-white disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </>
  );
}
