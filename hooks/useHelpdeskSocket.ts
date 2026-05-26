"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import {
  createTicket as apiCreateTicket,
  getTickets as apiGetTickets,
  updateTicket as apiUpdateTicket
} from "@/lib/api";

import { SOCKET_URL } from "@/lib/socket";

import type {
  ConnectionState,
  Ticket,
  TicketFormValues
} from "@/lib/types";

type LockResponse =
  | {
      ok: true;
      ticket: Ticket;
    }
  | {
      ok: false;
      message: string;
    };

function sortTickets(list: Ticket[]) {
  return [...list].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  );
}

export function useHelpdeskSocket(agentName: string) {
  const socketRef = useRef<Socket | null>(null);

  const agentNameRef = useRef(agentName);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const [socketId, setSocketId] =
    useState<string | null>(null);

  useEffect(() => {
    agentNameRef.current = agentName;
  }, [agentName]);

  const upsertTicket = useCallback(
    (incoming: Ticket) => {
      if (!incoming) return;

      setTickets((current) => {
        const index = current.findIndex(
          (ticket) => ticket.id === incoming.id
        );

        if (index === -1) {
          return sortTickets([
            incoming,
            ...current
          ]);
        }

        const next = [...current];

        next[index] = incoming;

        return sortTickets(next);
      });
    },
    []
  );

  useEffect(() => {
    let active = true;

    apiGetTickets()
      .then((data) => {
        if (!active) return;

        if (!Array.isArray(data)) {
          setTickets([]);
          return;
        }

        setTickets(sortTickets(data));
      })
      .catch(() => {
        if (!active) return;

        setTickets([]);
      });

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      timeout: 8000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionState("connected");

      setSocketId(socket.id ?? null);

      socket.emit("request_snapshot");
    });

    socket.on("disconnect", () => {
      setConnectionState("disconnected");

      setSocketId(null);
    });

    socket.on("reconnect_attempt", () => {
      setConnectionState("reconnecting");
    });

    socket.on("reconnect", () => {
      setConnectionState("connected");

      setSocketId(socket.id ?? null);

      socket.emit("request_snapshot");
    });

    socket.on("connect_error", () => {
      setConnectionState("reconnecting");
    });

    socket.on(
      "tickets_snapshot",
      (incoming: Ticket[]) => {
        if (!Array.isArray(incoming)) {
          setTickets([]);
          return;
        }

        setTickets(sortTickets(incoming));
      }
    );

    socket.on(
      "ticket_created",
      (incoming: Ticket) => {
        upsertTicket(incoming);
      }
    );

    socket.on(
      "ticket_locked",
      (incoming: Ticket) => {
        upsertTicket(incoming);
      }
    );

    socket.on(
      "ticket_unlocked",
      (incoming: Ticket) => {
        upsertTicket(incoming);
      }
    );

    socket.on(
      "ticket_updated",
      (incoming: Ticket) => {
        upsertTicket(incoming);
      }
    );

    return () => {
      active = false;

      socket.removeAllListeners();

      socket.disconnect();
    };
  }, [upsertTicket]);

  const lockTicket = useCallback(
    (ticketId: string) => {
      return new Promise<LockResponse>(
        (resolve) => {
          const socket = socketRef.current;

          if (!socket || !socket.connected) {
            resolve({
              ok: false,
              message:
                "Socket is not connected."
            });

            return;
          }

          socket.emit(
            "lock_ticket",
            {
              ticketId,
              agentName:
                agentNameRef.current
            },
            (
              response: LockResponse
            ) => {
              resolve(response);
            }
          );
        }
      );
    },
    []
  );

  const unlockTicket = useCallback(
    (ticketId: string) => {
      return new Promise<LockResponse>(
        (resolve) => {
          const socket = socketRef.current;

          if (!socket || !socket.connected) {
            resolve({
              ok: false,
              message:
                "Socket is not connected."
            });

            return;
          }

          socket.emit(
            "unlock_ticket",
            {
              ticketId
            },
            (
              response: LockResponse
            ) => {
              resolve(response);
            }
          );
        }
      );
    },
    []
  );

  const createNewTicket = useCallback(
    async (
      values: TicketFormValues
    ) => {
      const created =
        await apiCreateTicket(values);

      upsertTicket(created);

      return created;
    },
    [upsertTicket]
  );

  const saveTicket = useCallback(
    async (
      ticketId: string,
      values: TicketFormValues
    ) => {
      if (!socketId) {
        throw new Error(
          "Socket connection missing."
        );
      }

      const updated =
        await apiUpdateTicket(
          ticketId,
          {
            ...values,
            agentName:
              agentNameRef.current,
            socketId
          }
        );

      upsertTicket(updated);

      return updated;
    },
    [upsertTicket, socketId]
  );

  return {
    tickets,
    connectionState,
    socketId,
    lockTicket,
    unlockTicket,
    createNewTicket,
    saveTicket
  };
}