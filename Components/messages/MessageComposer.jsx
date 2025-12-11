import React, { useState } from 'react';
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Send } from "lucide-react";

export default function MessageComposer({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="resize-none min-h-[60px] max-h-[120px]"
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-orange-500 hover:bg-orange-600 h-[60px] px-6"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-slate-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
    </form>
  );
}