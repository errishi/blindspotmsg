"use client";

import { Button } from "@/components/ui/button";
import { Message } from "@/model/User";

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
};

export default function MessageCard({ message, onMessageDelete }: MessageCardProps) {
  const messageId = message._id?.toString?.() || "";
  const createdAt = message.createdAt
    ? new Date(message.createdAt).toLocaleString()
    : "";

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-3 text-sm leading-relaxed">{message.content}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{createdAt}</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onMessageDelete(messageId)}
          disabled={!messageId}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}