import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure this imports Tailwind base styles
import 'reactflow/dist/style.css'; // Import React Flow styles globally
import Navbar from "@/components/Navbar"; // Import Navbar
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenAI Agents Visual Designer",
  description: "Visually design and generate code for OpenAI Agents workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: '100%', position: 'relative' }}>
      <body className={`${inter.className} bg-background`} style={{ 
        height: '100%', 
        margin: 0, 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        // 確保沒有 overflow: hidden
      }}>
        <Navbar /> {/* Add Navbar at the top */}
        {/* Children (page content) will take the remaining space */}
        {children}
        <Toaster /> {/* Add Toaster for notifications */}
      </body>
    </html>
  );
} 