"use client";

import type { ConnectionState } from "@/lib/types";

export default function ConnectionBanner({ state }: { state: ConnectionState }) {
  if (state === "connected" || state === "connecting") {
    return null;
  }

  return (
    <div className="top-banner">
      <strong>Connection Lost: Reconnecting...</strong>
      <span> Your updates may not save until the socket connects again.</span>
    </div>
  );
}