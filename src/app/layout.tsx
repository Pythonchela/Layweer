import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LexFirm Pro | Professional Legal Services",
  description:
    "Expert legal counsel across Criminal, Civil, Family, Property, Corporate and more. Decades of experience. Trusted by thousands of clients.",
  keywords:
    "law firm, advocate, criminal lawyer, civil lawyer, high court, supreme court, legal services",
  openGraph: {
    title: "LexFirm Pro | Professional Legal Services",
    description: "Expert legal counsel. Trusted by thousands.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: "#1e3a8a", color: "#fff" },
          }}
        />
      </body>
    </html>
  );
}
