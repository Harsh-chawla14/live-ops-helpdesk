"use client";

import { useEffect, useMemo, useState } from "react";
import ConnectionBanner from "@/components/ConnectionBanner";
import CreateTicketModal from "@/components/CreateTicketModal";
import Header from "@/components/Header";
import TicketBoard from "@/components/TicketBoard";
import TicketEditor from "@/components/TicketEditor";
import { useHelpdeskSocket } from "@/hooks/useHelpdeskSocket";
import type { Ticket, TicketFormValues } from "@/lib/types";

function loadAgentName() {
  if (typeof window === "undefined") return "Agent 000";

  const saved = window.localStorage.getItem("helpdesk-agent-name");
  if (saved) return saved;

  const generated = `Agent ${Math.floor(100 + Math.random() * 900)}`;
  window.localStorage.setItem("helpdesk-agent-name", generated);
  return generated;
}

export default function Home() {
  const [agentName, setAgentName] = useState("Agent 000");
  const [ready, setReady] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const name = loadAgentName();
    setAgentName(name);
    setReady(true);
  }, []);

  const {
    tickets,
    connectionState,
    socketId,
    lockTicket,
    unlockTicket,
    createNewTicket,
    saveTicket
  } = useHelpdeskSocket(agentName);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) || null,
    [tickets, activeTicketId]
  );

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      locked: tickets.filter((ticket) => ticket.lockedBy).length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      critical: tickets.filter((ticket) => ticket.priority === "critical").length
    };
  }, [tickets]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleOpenTicket = async (ticket: Ticket) => {
    if (connectionState !== "connected") {
      setNotice("Connection lost. Reconnect before opening tickets.");
      return;
    }

    if (ticket.lockedBySocketId && ticket.lockedBySocketId !== socketId) {
      setNotice(`Ticket is already locked by ${ticket.lockedBy}.`);
      return;
    }

    setNotice(null);
    const response = await lockTicket(ticket.id);

    if (!response.ok) {
      setNotice(response.message);
      return;
    }

    setActiveTicketId(ticket.id);
  };

  const handleCloseEditor = async () => {
    if (!activeTicketId) return;

    if (connectionState !== "connected") {
      setActiveTicketId(null);
      setNotice("Connection lost. Ticket closed locally.");
      return;
    }

    await unlockTicket(activeTicketId);
    setActiveTicketId(null);
  };

  const handleSaveTicket = async (values: TicketFormValues) => {
    if (!activeTicket) return;

    if (connectionState !== "connected") {
      setNotice("Connection lost. Please reconnect before saving.");
      return;
    }

    setSaving(true);
    try {
      await saveTicket(activeTicket.id, values);
      await unlockTicket(activeTicket.id);
      setActiveTicketId(null);
      setNotice("Ticket saved and released successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTicket = async (values: TicketFormValues) => {
    try {
      await createNewTicket(values);
      setNotice("New ticket created and broadcast to everyone.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create ticket.");
    }
  };

  return (
    <main className="page-shell">
      <ConnectionBanner state={connectionState} />

      <Header
        agentName={ready ? agentName : "Loading agent..."}
        onCreateTicket={() => setCreateModalOpen(true)}
      />

      {notice ? <div className="notice-banner">{notice}</div> : null}

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Tickets</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Locked Now</span>
          <strong>{stats.locked}</strong>
        </div>
        <div className="stat-card">
          <span>Open</span>
          <strong>{stats.open}</strong>
        </div>
        <div className="stat-card">
          <span>Critical</span>
          <strong>{stats.critical}</strong>
        </div>
      </section>

      <div className="main-layout">
        <TicketBoard
          tickets={tickets}
          socketId={socketId}
          activeTicketId={activeTicketId}
          onOpenTicket={handleOpenTicket}
        />

        <aside className="sidebar-card">
          <h2>How it works</h2>
          <ul>
            <li>Click a ticket to emit <code>lock_ticket</code>.</li>
            <li>The server broadcasts the locked state instantly.</li>
            <li>Only the lock owner can edit and save.</li>
            <li>Saving or closing emits <code>unlock_ticket</code>.</li>
            <li>Disconnects show a red reconnection banner.</li>
          </ul>
        </aside>
      </div>

      {activeTicket ? (
        <TicketEditor
          ticket={activeTicket}
          socketId={socketId}
          connectionState={connectionState}
          saving={saving}
          onSave={handleSaveTicket}
          onClose={handleCloseEditor}
        />
      ) : null}

      {createModalOpen ? (
        <CreateTicketModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateTicket}
        />
      ) : null}
    </main>
  );
}