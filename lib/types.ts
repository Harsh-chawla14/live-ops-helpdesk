export type Priority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "pending" | "in_progress" | "resolved";
export type Channel = "Phone" | "Email" | "Portal" | "Chat";

export interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  customer: string;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  notes: string;
  channel: Channel;
  createdAt: string;
  updatedAt: string;
  lockedBy: string | null;
  lockedBySocketId: string | null;
}

export interface TicketFormValues {
  subject: string;
  customer: string;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  notes: string;
  channel: Channel;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";