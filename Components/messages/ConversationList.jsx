import React from 'react';
import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { User, ChefHat } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function ConversationList({ conversations, selectedConversation, onSelectConversation, currentUserEmail }) {
  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isSelected = selectedConversation?.otherUser.email === conv.otherUser.email;
        const unreadCount = conv.messages.filter(m => !m.is_read && m.receiver_email === currentUserEmail).length;
        const lastMessage = conv.messages[conv.messages.length - 1];
        
        return (
          <Card
            key={conv.otherUser.email}
            className={`cursor-pointer transition-all ${
              isSelected 
                ? 'border-orange-500 shadow-md bg-orange-50/50' 
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
            onClick={() => onSelectConversation(conv)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {conv.otherUser.profile_picture ? (
                  <img 
                    src={conv.otherUser.profile_picture} 
                    alt={conv.otherUser.full_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-6 h-6 text-orange-500" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {conv.otherUser.full_name}
                    </h4>
                    {lastMessage && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(lastMessage.created_date), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {lastMessage && (
                    <p className={`text-sm truncate ${
                      unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}>
                      {lastMessage.sender_email === currentUserEmail ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                  
                  {unreadCount > 0 && (
                    <Badge className="mt-2 bg-orange-500 text-white">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}