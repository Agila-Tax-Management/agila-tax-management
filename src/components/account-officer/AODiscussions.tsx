'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import {
  Search, Send, Building2, MessageSquare,
} from 'lucide-react';
import { INITIAL_AO_DISCUSSIONS, CURRENT_AO } from '@/lib/mock-ao-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AODiscussionMessage } from '@/lib/types';

export function AODiscussions() {
  const [messages, setMessages] = useState<AODiscussionMessage[]>(INITIAL_AO_DISCUSSIONS);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clients that have discussions or all clients
  const clientsWithConvos = useMemo(() => {
    const clientIdsWithMessages = [...new Set(messages.map(m => m.clientId))];
    return INITIAL_CLIENTS.filter(c => clientIdsWithMessages.includes(c.id));
  }, [messages]);

  const filteredClients = useMemo(() => {
    if (!search) return clientsWithConvos;
    return clientsWithConvos.filter(c =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.authorizedRep.toLowerCase().includes(search.toLowerCase())
    );
  }, [clientsWithConvos, search]);

  const selectedClient = INITIAL_CLIENTS.find(c => c.id === selectedClientId);
  const clientMessages = useMemo(() => {
    if (!selectedClientId) return [];
    return messages
      .filter(m => m.clientId === selectedClientId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, selectedClientId]);

  const getLastMessage = (clientId: string) => {
    const clientMsgs = messages.filter(m => m.clientId === clientId);
    return clientMsgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const getUnreadCount = (clientId: string) => {
    // Mock: client messages sent after last AO message are "unread"
    const clientMsgs = messages.filter(m => m.clientId === clientId);
    const lastAO = clientMsgs
      .filter(m => m.senderRole === 'account-officer')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!lastAO) return clientMsgs.filter(m => m.senderRole === 'client').length;
    return clientMsgs.filter(m => m.senderRole === 'client' && new Date(m.createdAt) > new Date(lastAO.createdAt)).length;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedClientId) return;
    const msg: AODiscussionMessage = {
      id: `msg-${Date.now()}`,
      clientId: selectedClientId,
      senderId: CURRENT_AO.id,
      senderName: CURRENT_AO.name,
      senderRole: 'account-officer',
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date('2026-03-11');
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: AODiscussionMessage[] }[] = [];
    clientMessages.forEach(msg => {
      const dateKey = new Date(msg.createdAt).toDateString();
      const existing = groups.find(g => g.date === dateKey);
      if (existing) {
        existing.messages.push(msg);
      } else {
        groups.push({ date: dateKey, messages: [msg] });
      }
    });
    return groups;
  }, [clientMessages]);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Discussions</h2>
        <p className="text-sm text-slate-500 font-medium">Chat with clients about their accounts and services.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          {/* Left: Client List */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-white shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredClients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No conversations found.</p>
              )}
              {filteredClients.map(client => {
                const lastMsg = getLastMessage(client.id);
                const unread = getUnreadCount(client.id);
                const isSelected = selectedClientId === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      isSelected ? 'bg-[#25238e]/5 border-l-2 border-l-[#25238e]!' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#25238e] rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${isSelected || unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {client.businessName}
                        </p>
                        {unread > 0 && (
                          <span className="w-5 h-5 bg-[#25238e] rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {lastMsg.senderRole === 'account-officer' ? 'You: ' : ''}{lastMsg.content}
                          </p>
                          <p className="text-[9px] text-slate-300 mt-0.5">{formatTime(lastMsg.createdAt)}</p>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="flex-1 flex flex-col bg-slate-50">
            {!selectedClientId && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Select a client to start a conversation</p>
                </div>
              </div>
            )}

            {selectedClient && (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 bg-[#25238e] rounded-xl flex items-center justify-center">
                    <Building2 size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedClient.businessName}</h3>
                    <p className="text-[10px] text-slate-400">{selectedClient.authorizedRep} • {selectedClient.email}</p>
                  </div>
                  <Badge variant={selectedClient.status === 'Active' ? 'success' : 'warning'} className="text-[9px] ml-auto">
                    {selectedClient.status}
                  </Badge>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {groupedMessages.map(group => (
                    <div key={group.date}>
                      {/* Date Separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {formatDateSeparator(group.messages[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      {group.messages.map(msg => {
                        const isAO = msg.senderRole === 'account-officer';
                        return (
                          <div key={msg.id} className={`flex mb-3 ${isAO ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isAO ? 'order-2' : ''}`}>
                              <div className={`flex items-center gap-2 mb-1 ${isAO ? 'justify-end' : ''}`}>
                                {!isAO && (
                                  <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-white">
                                      {msg.senderName.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                )}
                                <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>
                                <span className="text-[9px] text-slate-300">{formatTime(msg.createdAt)}</span>
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isAO
                                  ? 'bg-[#25238e] text-white rounded-br-md'
                                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 shrink-0">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#25238e] bg-slate-50"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-[#25238e] hover:bg-[#1a1868] text-white px-4 rounded-xl"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
