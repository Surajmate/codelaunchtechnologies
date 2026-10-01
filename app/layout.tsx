import type { Metadata } from "next";
import "./globals.css";

import Chatbot from "@/components/ai/Chatbot";

export const metadata: Metadata = {
  title: {
    default: "Codelaunch Technologies",
    template: "%s | Codelaunch Technologies",
  },
  description:
    "Codelaunch Technologies - Learn, build and grow with modern technology, software development, AI, cloud, APIs and real-world projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050812] text-white antialiased">
        {children}

        {/* Global Codelaunch AI Assistant */}
        {/* <Chatbot /> */}
      </body>
    </html>
  );
}