import React, { useEffect, useRef } from 'react';
import { Card } from "@/Components/ui/card";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

export default function MessageThread({ messages, currentUserEmail }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => {
        const isSent = message.sender_email === currentUserEmail;
        
        return (
          <div
            key={message.id}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
              <Card className={`${
                isSent 
                  ? 'bg-orange-500 text-white border-0' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="p-3">
                  <p className={`text-sm leading-relaxed ${isSent ? 'text-white' : 'text-slate-900'}`}>
                    {message.content}
                  </p>
                </div>
              </Card>
              
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-xs text-slate-400">
                  {format(new Date(message.created_at || message.created_date), 'h:mm a')}
                </span>
                {isSent && (
                  <span className="text-slate-400">
                    {message.is_read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
