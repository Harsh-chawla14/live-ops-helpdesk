"use client";

export default function Header({
  agentName,
  onCreateTicket
}: {
  agentName: string;
  onCreateTicket: () => void;
}) {
  return (
    <header className="header-card">
      <div className="header-copy">
        <p className="eyebrow">RapidDispatch Freight & Logistics</p>
        <h1>Live Ops Helpdesk</h1>
        <p className="subtle">
          Real-time collaborative ticket control with live locking, instant broadcasts, and zero polling.
        </p>
      </div>

      <div className="header-actions">
        <div className="agent-pill">
          <span className="agent-dot" />
          <div>
            <small>Signed in as</small>
            <strong>{agentName}</strong>
          </div>
        </div>

        <button className="primary-btn" onClick={onCreateTicket}>
          + New Ticket
        </button>
      </div>
    </header>
  );
}