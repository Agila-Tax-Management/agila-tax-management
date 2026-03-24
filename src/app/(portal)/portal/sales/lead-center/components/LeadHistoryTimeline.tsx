// src/app/(portal)/portal/sales/lead-center/components/LeadHistoryTimeline.tsx
'use client';

import { useState } from 'react';
import { Send, Loader2, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

export interface CommentAuthor { id: string; name: string; image: string | null; }
export interface HistoryActor  { id: string; name: string; }

export interface LeadCommentEntry {
  id: number;
  leadId: number;
  authorId: string;
  author: CommentAuthor;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadHistoryEntry {
  id: string;
  leadId: number;
  actorId: string;
  actor: HistoryActor;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

type TimelineItem =
  | { kind: 'comment'; data: LeadCommentEntry }
  | { kind: 'history'; data: LeadHistoryEntry };

interface LeadHistoryTimelineProps {
  leadId: number;
  initialComments: LeadCommentEntry[];
  initialHistory: LeadHistoryEntry[];
}

function formatChangeType(type: string): string {
  const map: Record<string, string> = {
    CREATED: 'Lead created',
    STATUS_CHANGED: 'Status changed',
    DETAILS_UPDATED: 'Details updated',
    SCHEDULE_UPDATED: 'Schedule updated',
    INVOICE_GENERATED: 'Invoice generated',
    CONTRACT_GENERATED: 'Contract generated',
    CONTRACT_SIGNED: 'Contract signed',
    TSA_GENERATED: 'TSA generated',
    TSA_SIGNED: 'TSA signed',
    JOB_ORDER_GENERATED: 'Job order generated',
    ACCOUNT_CREATED: 'Account created',
    CONVERTED: 'Lead converted',
  };
  return map[type] ?? type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LeadHistoryTimeline({ leadId, initialComments, initialHistory }: LeadHistoryTimelineProps): React.ReactNode {
  const { error } = useToast();
  const [comments, setComments] = useState<LeadCommentEntry[]>(initialComments);
  const [history] = useState<LeadHistoryEntry[]>(initialHistory);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: trimmed }),
      });
      const data = (await res.json()) as { data?: LeadCommentEntry; error?: string };
      if (!res.ok) { error('Failed to post', data.error ?? 'Could not save comment.'); return; }
      setComments((prev) => [...prev, data.data!]);
      setCommentText('');
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeline: TimelineItem[] = [
    ...comments.map((c) => ({ kind: 'comment' as const, data: c })),
    ...history.map((h) => ({ kind: 'history' as const, data: h })),
  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());

  return (
    <div className="flex flex-col h-full">
      {/* Timeline feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {timeline.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 italic">
            No activity yet.
          </p>
        )}

        {timeline.map((item) => {
          if (item.kind === 'comment') {
            const c = item.data;
            return (
              <div key={`c-${c.id}`} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={13} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-foreground">{c.author.name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-xs text-foreground leading-relaxed">
                    {c.comment}
                  </div>
                </div>
              </div>
            );
          }

          // history item
          const h = item.data;
          return (
            <div key={`h-${h.id}`} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={12} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{h.actor.name}</span>
                  {' · '}
                  {formatChangeType(h.changeType)}
                  {h.oldValue && h.newValue && (
                    <span>
                      {' '}— <span className="line-through text-muted-foreground/60">{h.oldValue}</span>
                      {' → '}<span className="text-foreground font-medium">{h.newValue}</span>
                    </span>
                  )}
                </span>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatDate(h.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment input */}
      <div className="border-t border-border pt-3 mt-2">
        <div className="flex gap-2">
          <textarea
            rows={2}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleSubmit();
            }}
          />
          <Button
            onClick={() => { void handleSubmit(); }}
            disabled={submitting || !commentText.trim()}
            className="bg-[#25238e] text-white self-end"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter to submit</p>
      </div>
    </div>
  );
}
