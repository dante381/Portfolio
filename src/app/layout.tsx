import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anish Kshirsagar — Data Engineer",
  description:
    "Data Engineer specialising in production-scale data infrastructure: Customer MDM, Data Reliability Platforms, and Azure Lakehouse ETL/ELT on Spark and Databricks.",
  keywords: [
    "Data Engineer",
    "PySpark",
    "Azure Databricks",
    "Delta Lake",
    "ETL",
    "Data Reliability",
    "MDM",
    "Anish Kshirsagar",
  ],
  authors: [{ name: "Anish Kshirsagar" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anishkshirsagar.dev",
    title: "Anish Kshirsagar — Data Engineer",
    description:
      "Data Engineer specialising in production-scale data infrastructure: Customer MDM, Data Reliability Platforms, and Azure Lakehouse ETL/ELT.",
    siteName: "Anish Kshirsagar Portfolio",
  },
  twitter: {
    card: "summary",
    title: "Anish Kshirsagar — Data Engineer",
    description:
      "Data Engineer specialising in production-scale data infrastructure: Customer MDM, Data Reliability Platforms, and Azure Lakehouse ETL/ELT.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg)]">
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="
            sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
            focus:z-50 focus:px-4 focus:py-2 focus:rounded
            focus:bg-[var(--color-accent)] focus:text-[var(--color-bg)]
            focus:font-medium focus:text-sm
          "
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
