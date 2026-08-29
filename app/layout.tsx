import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Samarthya — Ideas into Impact", template: "%s · Samarthya" }, description: "A simple platform connecting verified community challenges with universities and industry partners.", applicationName: "Samarthya", keywords: ["social innovation", "university collaboration", "community challenges", "Jharkhand", "SIH"], icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }, other: { "theme-color": "#16463c" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
