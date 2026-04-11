import { MessagesClient } from "@/components/shared/messages-client";

export default function MessagesPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Messages
        </p>
        <h1 className="section-title text-2xl font-semibold text-ink sm:text-3xl">
          Conversations
        </h1>
      </div>
      <MessagesClient />
    </div>
  );
}
