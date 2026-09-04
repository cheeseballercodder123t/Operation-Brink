import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Project Brink - 1960s Cold War Simulator',
  description: 'Autonomous geopolitical and tactical Cold War simulator featuring 4 AI nations, continuous vector battlefield, 1960s air doctrine, and multi-provider AI commander orchestration.',
  openGraph: {
    title: 'Project Brink - 1960s Cold War Simulator',
    description: 'Autonomous geopolitical and tactical Cold War simulator featuring 4 AI nations, continuous vector battlefield, 1960s air doctrine, and multi-provider AI commander orchestration.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Brink - 1960s Cold War Simulator',
    description: 'Autonomous geopolitical and tactical Cold War simulator featuring 4 AI nations, continuous vector battlefield, 1960s air doctrine, and multi-provider AI commander orchestration.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
