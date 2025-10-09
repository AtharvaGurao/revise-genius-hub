import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Bot, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { page: number; snippet: string }[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatUIProps {
  selectedPdfId: string | null;
}

const ChatUI = ({ selectedPdfId }: ChatUIProps) => {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "chat-1",
      title: "New Chat",
      messages: [],
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState("chat-1");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat.messages]);

  const handleNewChat = async () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      messages: [],
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
    };

    // Add user message
    const updatedChats = chats.map((chat) =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    );
    setChats(updatedChats);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      // Call n8n webhook
      const response = await fetch("https://atharvagurao.app.n8n.cloud/webhook/5c2ac1c1-66b3-4086-9e09-66c01abe3222/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          timestamp: new Date().toISOString(),
          user_id: userId || null
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      const webhookData = await response.json();
      
      // Extract assistant response from webhook
      const assistantContent = webhookData.response || webhookData.message || JSON.stringify(webhookData);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: assistantContent,
      };

      // Add assistant message to chat
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );

      // Save messages to database if user is logged in
      if (userId) {
        await supabase.from("chat_messages").insert([
          {
            user_id: userId,
            conversation_id: currentChatId,
            role: "user",
            content: userMessage.content,
          },
          {
            user_id: userId,
            conversation_id: currentChatId,
            role: "assistant",
            content: assistantContent,
          }
        ]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Message failed",
        description: error.message || "Could not send message. Please try again.",
        variant: "destructive",
      });
      
      // Add fallback assistant message on error
      const fallbackMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting to the AI service. Please check your connection and try again.",
      };
      
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, fallbackMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Chat Header */}
      <div className="bg-card border-b px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <h3 className="font-heading font-semibold text-sm sm:text-base truncate">{currentChat.title}</h3>
        <Button onClick={handleNewChat} size="sm" variant="outline" className="flex-shrink-0">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {currentChat.messages.length === 0 ? (
            <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4 px-4">
              <Bot className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-heading font-semibold text-lg sm:text-xl mb-2">
                  Ask me anything about your PDFs
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  I can help explain concepts, answer questions, and provide citations from your
                  coursebooks.
                </p>
              </div>
            </div>
          ) : (
            currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                )}

                <Card
                  className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <p className="text-xs font-semibold flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        References:
                      </p>
                      {msg.citations.map((citation, i) => (
                        <div key={i} className="text-xs bg-muted p-2 rounded">
                          <Badge variant="outline" className="mb-1">
                            Page {citation.page}
                          </Badge>
                          <p className="text-muted-foreground">{citation.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-card border-t p-2 sm:p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-1 sm:gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your PDFs..."
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
              className="flex-shrink-0"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatUI;
