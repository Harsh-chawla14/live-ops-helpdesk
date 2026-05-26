"use client";

import { useEffect, useState } from "react";
import type { Ticket, TicketFormValues } from "@/lib/types";

const defaultForm = (ticket: Ticket): TicketFormValues => ({
  subject: ticket.subject,
  customer: ticket.customer,
  priority: ticket.priority,
  status: ticket.status,
  assignee: ticket.assignee,
  notes: ticket.notes,
  channel: ticket.channel
});

export default function TicketEditor({
  ticket,
  socketId,
  connectionState,
  saving,
  onSave,
  onClose
}: {
  ticket: Ticket;
  socketId: string | null;
  connectionState: "connecting" | "connected" | "reconnecting" | "disconnected";
  saving: boolean;
  onSave: (values: TicketFormValues) => Promise<void>;
  onClose: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<TicketFormValues>(defaultForm(ticket));

  useEffect(() => {
    setForm(defaultForm(ticket));
  }, [ticket]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isEditable = connectionState === "connected" && ticket.lockedBySocketId === socketId;

  return (
    <div className="drawer-overlay" onClick={() => onClose()}>
      <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Editing Ticket #{ticket.ticketNumber}</p>
            <h2>{ticket.subject}</h2>
            <p className="subtle">
              {ticket.lockedBy ? (
                ticket.lockedBySocketId === socketId ? (
                  <>Locked by you. Nobody else can edit this ticket right now.</>
                ) : (
                  <>Locked by {ticket.lockedBy}. Editing is disabled.</>
                )
              ) : (
                <>This ticket is currently open for locking.</>
              )}
            </p>
          </div>

          <button className="ghost-btn" onClick={() => onClose()} disabled={saving}>
            Close
          </button>
        </div>

        <div className="drawer-body">
          <div className="field-grid">
            <label className="field">
              <span>Subject</span>
              <input
                value={form.subject}
                disabled={!isEditable || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Customer</span>
              <input
                value={form.customer}
                disabled={!isEditable || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
                disabled={!isEditable || saving}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value as TicketFormValues["priority"] }))
                }
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                disabled={!isEditable || saving}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as TicketFormValues["status"] }))
                }
              >
                <option value="open">open</option>
                <option value="pending">pending</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
              </select>
            </label>

            <label className="field">
              <span>Assignee</span>
              <input
                value={form.assignee}
                disabled={!isEditable || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, assignee: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Channel</span>
              <select
                value={form.channel}
                disabled={!isEditable || saving}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, channel: event.target.value as TicketFormValues["channel"] }))
                }
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="Portal">Portal</option>
                <option value="Chat">Chat</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={7}
              value={form.notes}
              disabled={!isEditable || saving}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </label>
        </div>

        <div className="drawer-actions">
          <button className="secondary-btn" onClick={() => onClose()} disabled={saving}>
            Close without saving
          </button>

          <button className="primary-btn" disabled={!isEditable || saving} onClick={() => onSave(form)}>
            {saving ? "Saving..." : "Save & Release"}
          </button>
        </div>
      </aside>
    </div>
  );
}