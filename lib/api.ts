import { API_URL } from "./socket";
import type { Ticket, TicketFormValues } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data as T;
}

export function getTickets() {
  return request<Ticket[]>("/api/tickets");
}

export function createTicket(values: TicketFormValues) {
  return request<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(values)
  });
}

export function updateTicket(ticketId: string, values: TicketFormValues & { agentName: string; socketId: string }) {
  return request<Ticket>(`/api/tickets/${ticketId}`, {
    method: "PUT",
    body: JSON.stringify(values)
  });
}