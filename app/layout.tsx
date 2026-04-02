// Server Component — NO 'use client'
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'POGrid',
  description: 'Factory Floor Production Tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={dmSans.variable}>
      <body className={`${dmSans.className} bg-[#F8F9FA]`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
