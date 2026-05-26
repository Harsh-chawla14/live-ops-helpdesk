"use client";

import type { Ticket } from "@/lib/types";

function priorityClass(priority: Ticket["priority"]) {
  return `priority-badge priority-${priority}`;
}

function statusLabel(status: Ticket["status"]) {
  return status.replace("_", " ");
}

export default function TicketCard({
  ticket,
  socketId,
  isActive,
  onOpen
}: {
  ticket?: Ticket;
  socketId: string | null;
  isActive: boolean;
  onOpen: (ticket: Ticket) => void;
}) {
  if (!ticket) return null;

  const lockedByOther = Boolean(ticket.lockedBySocketId && ticket.lockedBySocketId !== socketId);
  const ownedByMe = Boolean(ticket.lockedBySocketId && ticket.lockedBySocketId === socketId);

  return (
    <article
      className={[
        "ticket-card",
        lockedByOther ? "locked" : "",
        isActive ? "active" : ""
      ].join(" ")}
      onClick={() => onOpen(ticket)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(ticket);
      }}
    >
      <div className="ticket-topline">
        <div>
          <p className="ticket-number">Ticket #{ticket.ticketNumber}</p>
          <h3>{ticket.subject}</h3>
        </div>
        <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
      </div>

      <p className="ticket-customer">{ticket.customer}</p>

      <div className="ticket-meta">
        <span className="status-badge">{statusLabel(ticket.status)}</span>

        {ticket.lockedBy ? (
          <span className="lock-badge">🔒 Locked by {ticket.lockedBy}</span>
        ) : (
          <span className="open-badge">Open</span>
        )}
      </div>

      <div className="ticket-footer">
        <div className="ticket-assignee">
          <span>Assigned to</span>
          <strong>{ticket.assignee}</strong>
        </div>

        <button
          className="secondary-btn small"
          disabled={lockedByOther}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(ticket);
          }}
        >
          {lockedByOther ? "Locked" : ownedByMe ? "Continue Editing" : "Edit"}
        </button>
      </div>
    </article>
  );
}