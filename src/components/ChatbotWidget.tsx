import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { aiService } from '@/utils/ai-service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: "Hello! How can I help you today?", sender: "bot" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const userMessage: ChatMessage = { text: newMessage, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setLoading(true);

    try {
      // Prepare chat history for context (role: user/assistant)
      const chatHistory = [
        { role: "system" as const, content: "You are a helpful assistant for Credit Clarity users. Answer questions about credit, reports, disputes, and the platform." },
        ...messages.map((msg) => ({
          role: msg.sender === "user" ? "user" as const : "assistant" as const,
          content: msg.text
        })),
        { role: "user" as const, content: newMessage }
      ];

      const response = await aiService.chatCompletion(chatHistory, "gpt-4", 256);
      setMessages((prev) => [...prev, { text: response, sender: "bot" }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I couldn't process your request. Please try again.", sender: "bot" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          className="rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
          onClick={toggleChat}
        >
          Chat
        </Button>
      ) : (
        <Card className="w-80 h-[400px] flex flex-col shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Chat with us!</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleChat}>
              X
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 border-t border-b" ref={chatContentRef}>
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    message.sender === "bot"
                      ? "bg-gray-100 self-start"
                      : "bg-blue-100 self-end text-right ml-auto"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {loading && (
                <div className="p-2 rounded-lg bg-gray-100 max-w-[80%] self-start animate-pulse">
                  Typing...
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 flex items-center space-x-2">
            <Textarea
              placeholder="Type your message..."
              className="flex-1 resize-none"
              rows={1}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
              Send
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ChatbotWidget;