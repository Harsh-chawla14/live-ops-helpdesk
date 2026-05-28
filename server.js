const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

let io = null;
let nextTicketNumber = 105;

const now = () => new Date().toISOString();

const cloneTicket = (ticket) => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  customer: ticket.customer,
  priority: ticket.priority,
  status: ticket.status,
  assignee: ticket.assignee,
  notes: ticket.notes,
  channel: ticket.channel,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
  lockedBy: ticket.lockedBy,
  lockedBySocketId: ticket.lockedBySocketId
});

let tickets = [
  {
    id: randomUUID(),
    ticketNumber: 101,
    subject: "Late shipment on Route 77",
    customer: "NorthPeak Retail",
    priority: "high",
    status: "open",
    assignee: "Unassigned",
    notes: "Truck delayed because of a mechanical inspection issue.",
    channel: "Phone",
    createdAt: now(),
    updatedAt: now(),
    lockedBy: null,
    lockedBySocketId: null
  },
  {
    id: randomUUID(),
    ticketNumber: 102,
    subject: "Invoice mismatch for bulk delivery",
    customer: "Lumen Supply Co.",
    priority: "critical",
    status: "in_progress",
    assignee: "Maya",
    notes: "Customer reports double charge on two packages.",
    channel: "Email",
    createdAt: now(),
    updatedAt: now(),
    lockedBy: null,
    lockedBySocketId: null
  },
  {
    id: randomUUID(),
    ticketNumber: 103,
    subject: "Driver unreachable after pickup",
    customer: "ArcEdge Foods",
    priority: "medium",
    status: "pending",
    assignee: "Rahul",
    notes: "Need callback confirmation from driver and dispatch team.",
    channel: "Portal",
    createdAt: now(),
    updatedAt: now(),
    lockedBy: null,
    lockedBySocketId: null
  },
  {
    id: randomUUID(),
    ticketNumber: 104,
    subject: "Customs hold on international freight",
    customer: "BlueWave Imports",
    priority: "high",
    status: "open",
    assignee: "Unassigned",
    notes: "Awaiting missing invoice paperwork from vendor.",
    channel: "Chat",
    createdAt: now(),
    updatedAt: now(),
    lockedBy: null,
    lockedBySocketId: null
  }
];

tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

function emitSnapshot() {
  if (!io) return;
  io.emit("tickets_snapshot", tickets.map(cloneTicket));
}

function findTicket(ticketId) {
  return tickets.find((ticket) => ticket.id === ticketId);
}

function broadcastTicket(type, ticket) {
  if (!io) return;
  io.emit(type, cloneTicket(ticket));
}

function releaseLocksForSocket(socketId) {
  let changed = false;

  tickets.forEach((ticket) => {
    if (ticket.lockedBySocketId === socketId) {
      ticket.lockedBy = null;
      ticket.lockedBySocketId = null;
      ticket.updatedAt = now();
      changed = true;
      broadcastTicket("ticket_unlocked", ticket);
    }
  });

  if (changed) {
    tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/tickets", (_req, res) => {
  res.json(tickets.map(cloneTicket));
});

app.post("/api/tickets", (req, res) => {
  const {
    subject,
    customer,
    priority = "medium",
    status = "open",
    assignee = "Unassigned",
    notes = "",
    channel = "Portal"
  } = req.body || {};

  if (!subject || !customer) {
    return res.status(400).json({ message: "Subject and customer are required." });
  }

  const ticket = {
    id: randomUUID(),
    ticketNumber: nextTicketNumber++,
    subject: String(subject).trim(),
    customer: String(customer).trim(),
    priority,
    status,
    assignee,
    notes,
    channel,
    createdAt: now(),
    updatedAt: now(),
    lockedBy: null,
    lockedBySocketId: null
  };

  tickets.unshift(ticket);
  broadcastTicket("ticket_created", ticket);

  res.status(201).json(cloneTicket(ticket));
});

app.put("/api/tickets/:id", (req, res) => {
  const ticket = findTicket(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found." });
  }

  const {
    socketId,
    subject,
    customer,
    priority,
    status,
    assignee,
    notes,
    channel
  } = req.body || {};

  if (ticket.lockedBySocketId && ticket.lockedBySocketId !== socketId) {
    return res.status(409).json({ message: `Ticket is locked by ${ticket.lockedBy}.` });
  }

  if (typeof subject === "string") ticket.subject = subject.trim();
  if (typeof customer === "string") ticket.customer = customer.trim();
  if (typeof priority === "string") ticket.priority = priority;
  if (typeof status === "string") ticket.status = status;
  if (typeof assignee === "string") ticket.assignee = assignee.trim();
  if (typeof notes === "string") ticket.notes = notes;
  if (typeof channel === "string") ticket.channel = channel;

  ticket.updatedAt = now();

  tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  broadcastTicket("ticket_updated", ticket);

  res.json(cloneTicket(ticket));
});

const server = http.createServer(app);

io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT"]
  }
});

io.on("connection", (socket) => {
  socket.emit("tickets_snapshot", tickets.map(cloneTicket));

  socket.on("request_snapshot", () => {
    socket.emit("tickets_snapshot", tickets.map(cloneTicket));
  });

  socket.on("lock_ticket", ({ ticketId, agentName }, ack = () => {}) => {
    const ticket = findTicket(ticketId);

    if (!ticket) {
      return ack({ ok: false, message: "Ticket not found." });
    }

    if (ticket.lockedBySocketId && ticket.lockedBySocketId !== socket.id) {
      return ack({ ok: false, message: `Ticket locked by ${ticket.lockedBy}.` });
    }

    ticket.lockedBy = agentName;
    ticket.lockedBySocketId = socket.id;
    ticket.updatedAt = now();

    tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    broadcastTicket("ticket_locked", ticket);

    ack({ ok: true, ticket: cloneTicket(ticket) });
  });

  socket.on("unlock_ticket", ({ ticketId }, ack = () => {}) => {
    const ticket = findTicket(ticketId);

    if (!ticket) {
      return ack({ ok: false, message: "Ticket not found." });
    }

    if (ticket.lockedBySocketId && ticket.lockedBySocketId !== socket.id) {
      return ack({ ok: false, message: `Ticket locked by ${ticket.lockedBy}.` });
    }

    ticket.lockedBy = null;
    ticket.lockedBySocketId = null;
    ticket.updatedAt = now();

    tickets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    broadcastTicket("ticket_unlocked", ticket);

    ack({ ok: true, ticket: cloneTicket(ticket) });
  });

  socket.on("disconnect", () => {
    releaseLocksForSocket(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Live Ops Helpdesk server running on http://localhost:${PORT}`);
});