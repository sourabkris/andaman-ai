import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Andaman AI - Smart Travel Companion",
  description: "Context-aware AI travel assistant for the Andaman & Nicobar Islands. Plan itineraries, visualize routes, and save to Google Calendar.",
  keywords: ["Andaman", "Nicobar", "travel", "itinerary", "AI", "Google Maps", "trip planner"],
  authors: [{ name: "Andaman AI" }],
  openGraph: {
    title: "Andaman AI - Smart Travel Companion",
    description: "Plan your perfect Andaman Islands trip with AI-powered itineraries.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Andaman AI",
  "description": "AI-powered travel planning assistant for the Andaman & Nicobar Islands.",
  "url": "https://andaman-ai.vercel.app",
  "areaServed": {
    "@type": "Place",
    "name": "Andaman and Nicobar Islands"
  },
  "serviceType": "AI Travel Planning",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
