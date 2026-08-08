import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { CustomCursor } from '../src/components/ui/CustomCursor';
import { SmoothScroll } from '../src/components/ui/SmoothScroll';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Chirudeva Reddy — AI/ML Engineer',
  description:
    'Chirudeva Reddy Butukuri is a computer science scholar and AI/ML engineer focused on computer vision, NLP, and privacy-preserving systems.',
  icons: {
    apple: '/assets/favicon/apple-touch-icon.png',
    icon: [
      { type: 'image/svg+xml', url: '/assets/favicon/favicon.svg' },
      {
        sizes: '96x96',
        type: 'image/png',
        url: '/assets/favicon/favicon-96x96.png',
      },
    ],
  },
};

export interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <CustomCursor />
      </body>
    </html>
  );
}
