"use client";

import { useMemo, useState } from "react";
import type { Ticket } from "@/lib/types";
import TicketCard from "./TicketCard";

const statusOptions = ["all", "open", "pending", "in_progress", "resolved"] as const;
const priorityOptions = ["all", "low", "medium", "high", "critical"] as const;

function matchesText(ticket: Ticket, query: string) {
  const value = query.toLowerCase().trim();
  if (!value) return true;

  return (
    ticket.subject.toLowerCase().includes(value) ||
    ticket.customer.toLowerCase().includes(value) ||
    String(ticket.ticketNumber).includes(value) ||
    ticket.assignee.toLowerCase().includes(value)
  );
}

export default function TicketBoard({
  tickets = [],
  socketId = null,
  activeTicketId,
  onOpenTicket
}: {
  tickets?: Ticket[];
  socketId?: string | null;
  activeTicketId: string | null;
  onOpenTicket: (ticket: Ticket) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("all");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>("all");

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const statusMatch = statusFilter === "all" ? true : ticket.status === statusFilter;
      const priorityMatch = priorityFilter === "all" ? true : ticket.priority === priorityFilter;
      const textMatch = matchesText(ticket, query);
      return statusMatch && priorityMatch && textMatch;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  return (
    <section className="board-card">
      <div className="board-head">
        <div>
          <h2>Live Ticket Board</h2>
          <p>Click any ticket to lock it immediately. Other agents see the lock in real time.</p>
        </div>

        <div className="board-count">
          <strong>{filteredTickets.length}</strong>
          <span>shown</span>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by ticket, customer, assignee..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          className="select-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option.replace("_", " ")}
            </option>
          ))}
        </select>

        <select
          className="select-input"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as (typeof priorityOptions)[number])}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All priorities" : option}
            </option>
          ))}
        </select>
      </div>

      <div className="board-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <h3>No tickets match these filters.</h3>
            <p>Try a different search term or create a new ticket.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              socketId={socketId}
              isActive={activeTicketId === ticket.id}
              onOpen={onOpenTicket}
            />
          ))
        )}
      </div>
    </section>
  );
}