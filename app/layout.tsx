import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeEstimator PRO - Contractor Burden & Margin Protection',
  description:
    'Calculate indirect business overhead burden, direct materials, labor, subs, and protect bid margins with client-ready PDF proposals.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
