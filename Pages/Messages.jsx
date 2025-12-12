import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { ChefHat, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/Components/ui/button";
import ConversationList from "@/Components/messages/ConversationList";
import MessageThread from "@/Components/messages/MessageThread";
import MessageComposer from "@/Components/messages/MessageComposer";
import { getStoredUser, DEMO_USER } from '../auth';
import { supabase } from "@/src/lib/supabaseClient";
import { toast } from "sonner";

export default function Messages() {
  const [user, setUser] = useState(() => getStoredUser() || DEMO_USER);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all messages involving the user
  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Fetch all users for profile info
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-messages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => {
      toast.error("Could not send message. Please try again.");
    },
  });

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!user?.email) return [];
    
    const convMap = new Map();
    
    allMessages.forEach(msg => {
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      
      if (!convMap.has(otherEmail)) {
        const otherUser = allUsers.find(u => u.email === otherEmail) || {
          email: otherEmail,
          full_name: msg.sender_email === user.email ? msg.receiver_name : msg.sender_name,
        };
        
        convMap.set(otherEmail, {
          otherUser,
          messages: [],
        });
      }
      
      convMap.get(otherEmail).messages.push(msg);
    });
    
    return Array.from(convMap.values()).sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1];
      const lastB = b.messages[b.messages.length - 1];
      return new Date(lastB.created_at || lastB.created_date) - new Date(lastA.created_at || lastA.created_date);
    });
  }, [allMessages, user?.email, allUsers]);

  // Derive active conversation from selectedEmail so new messages hydrate automatically
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.otherUser.email === selectedEmail) || null,
    [conversations, selectedEmail]
  );

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.email) {
      const unreadMessages = selectedConversation.messages
        .filter(m => !m.is_read && m.receiver_email === user.email)
        .map(m => m.id);
      
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(unreadMessages);
      }
    }
  }, [selectedConversation?.otherUser.email, selectedConversation?.messages, user?.email]);

  const handleSendMessage = async (content) => {
    if (!selectedConversation || !user) return;
    if (!content.trim()) return;
    await sendMessageMutation.mutateAsync({
      sender_email: user.email,
      sender_name: user.full_name,
      receiver_email: selectedConversation.otherUser.email,
      receiver_name: selectedConversation.otherUser.full_name,
      content: content.trim(),
      is_read: false,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  const unreadCount = allMessages.filter(m => !m.is_read && m.receiver_email === user.email).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.06),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4 bg-amber-50/80 backdrop-blur-sm border border-amber-100 text-amber-800 text-sm px-4 py-2 rounded-full shadow-sm">
          Coordinate directly with hosts. This is a community platform—no payments or delivery, and sharing is at your discretion.
        </div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center border border-orange-100/50">
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-lg">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-slate-600">Connect with cooks and food lovers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg shadow-slate-900/5 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-slate-100/80 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : conversations.length > 0 ? (
                    <ConversationList
                      conversations={conversations}
                      selectedConversation={selectedConversation}
                      onSelectConversation={(conv) => setSelectedEmail(conv?.otherUser?.email || null)}
                      currentUserEmail={user.email}
                    />
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No messages yet</p>
                    <p className="text-slate-400 text-xs mt-1">Start a conversation with a cook!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg shadow-slate-900/5 bg-white/80 backdrop-blur-sm h-[calc(100vh-200px)] flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Thread Header */}
                  <CardHeader className="border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      
                      {selectedConversation.otherUser.profile_picture ? (
                        <img 
                          src={selectedConversation.otherUser.profile_picture} 
                          alt={selectedConversation.otherUser.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm">
                          <ChefHat className="w-5 h-5 text-orange-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {selectedConversation.otherUser.full_name}
                        </h3>
                        <p className="text-xs text-slate-500">{selectedConversation.otherUser.email}</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto">
                    <MessageThread
                      messages={selectedConversation.messages}
                      currentUserEmail={user.email}
                    />
                  </div>

                  {/* Composer */}
                  <MessageComposer
                    onSend={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">Select a conversation</p>
                    <p className="text-slate-400 text-sm mt-1">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
