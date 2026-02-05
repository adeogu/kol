import { MessagesClient } from "@/components/shared/messages-client";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Messages
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Conversations
        </h1>
      </div>
      <MessagesClient />
    </div>
  );
}
