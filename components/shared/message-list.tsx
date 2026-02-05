type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read?: boolean;
};

type Props = {
  messages: Message[];
  currentUserId?: string;
};

export function MessageList({ messages, currentUserId }: Props) {
  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId;
        return (
          <div
            key={message.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                isMine
                  ? "bg-forest text-white"
                  : "border border-ink/10 bg-white text-ink"
              }`}
            >
              <p>{message.content}</p>
              <p
                className={`mt-1 text-[10px] ${
                  isMine ? "text-white/70" : "text-ink/50"
                }`}
              >
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
