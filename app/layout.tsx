import "./globals.css";

export const metadata = {
  title: "Live Ops Helpdesk",
  description: "Real-time collaborative helpdesk dashboard for freight operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}