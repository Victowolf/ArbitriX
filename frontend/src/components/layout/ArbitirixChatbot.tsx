import { useState, type FormEvent } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { gatewayApi } from "@/lib/arbitix-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ChatMessage = {
  id: number;
  author: "assistant" | "user";
  text: string;
};

const welcomeMessage: ChatMessage = {
  id: 1,
  author: "assistant",
  text: "Hi, I’m here to help you navigate agents, API access, and deployment workflows.",
};

export function ArbitirixChatbot() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [sending, setSending] = useState(false);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();

    if (!text) return;

    setMessages((previous) => [...previous, { id: Date.now(), author: "user", text }]);
    setDraft("");
    setSending(true);
    try {
      const history = messages
        .slice(-10)
        .map((message) => ({ role: message.author, text: message.text }));
      const result = await gatewayApi.chatbot(text, history);
      setMessages((previous) => [
        ...previous,
        { id: Date.now(), author: "assistant", text: result.reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          author: "assistant",
          text: error instanceof Error ? error.message : "The chatbot is temporarily unavailable.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-[10px] border border-border bg-foreground px-3 text-[13px] font-medium text-background shadow-lg transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
        aria-label="Open Arbitirix chatbot"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Chat with Arbitirix</span>
      </button>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[390px]">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <SheetTitle className="text-[15px]">Arbitirix chatbot</SheetTitle>
              <SheetDescription className="mt-0.5 text-[12px]">
                AI support for your marketplace workflow
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto bg-surface/50 px-4 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.author === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.author === "assistant" ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-background text-brand">
                  <Bot className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <p
                className={`max-w-[80%] rounded-[10px] px-3 py-2 text-[12px] leading-5 ${message.author === "user" ? "bg-foreground text-background" : "border border-border bg-card text-foreground"}`}
              >
                {message.text}
              </p>
              {message.author === "user" ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about ArbitriX…"
              className="h-9 text-[13px]"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Send message"
              disabled={sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Powered by the Arbitix AI support gateway.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
