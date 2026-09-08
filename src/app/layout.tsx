import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://esperanca-2026.vercel.app'),
  title: {
    default: 'Semana da Esperança 2026 | Jesus, Nossa Esperança',
    template: '%s | Semana da Esperança 2026',
  },
  description: 'Uma semana para reencontrar a esperança. Encontre uma igreja perto de você e participe da Semana da Esperança 2026 — 19 a 26 de setembro.',
  keywords: ['Semana da Esperança', 'Jesus', 'Igreja', 'Evangelismo', '2026', 'Rio Grande do Sul'],
  authors: [{ name: 'Associação Gaúcha' }],
  creator: 'Associação Gaúcha',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Semana da Esperança 2026',
    title: 'Semana da Esperança 2026 | Jesus, Nossa Esperança',
    description: 'Uma semana para reencontrar a esperança. Encontre uma igreja perto de você.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Semana da Esperança 2026',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Semana da Esperança 2026',
    description: 'Uma semana para reencontrar a esperança.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Ir para o conteúdo principal
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
