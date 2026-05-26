"use client";

import { useEffect, useState } from "react";
import type { TicketFormValues } from "@/lib/types";

const initialForm: TicketFormValues = {
  subject: "",
  customer: "",
  priority: "medium",
  status: "open",
  assignee: "Unassigned",
  notes: "",
  channel: "Portal"
};

export default function CreateTicketModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (values: TicketFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<TicketFormValues>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const submit = async () => {
    if (!form.subject.trim() || !form.customer.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onCreate(form);
      setForm(initialForm);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Create New Ticket</p>
            <h2>Quick ticket entry</h2>
            <p className="subtle">A new ticket will appear instantly for every connected agent.</p>
          </div>

          <button className="ghost-btn" onClick={onClose} disabled={submitting}>
            Close
          </button>
        </div>

        <div className="drawer-body">
          <div className="field-grid">
            <label className="field">
              <span>Subject</span>
              <input
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Example: Damaged package on delivery"
              />
            </label>

            <label className="field">
              <span>Customer</span>
              <input
                value={form.customer}
                onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))}
                placeholder="Example: Horizon Imports"
              />
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
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
                onChange={(event) => setForm((prev) => ({ ...prev, assignee: event.target.value }))}
                placeholder="Unassigned"
              />
            </label>

            <label className="field">
              <span>Channel</span>
              <select
                value={form.channel}
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
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Add resolution details, customer remarks, or dispatch notes."
            />
          </label>
        </div>

        <div className="drawer-actions">
          <button className="secondary-btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button
            className="primary-btn"
            onClick={submit}
            disabled={submitting || !form.subject.trim() || !form.customer.trim()}
          >
            {submitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </aside>
    </div>
  );
}