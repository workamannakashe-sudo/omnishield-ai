import './globals.css'

export const metadata = {
  title: 'OmniShield AI - Secure Operator Command Center',
  description: 'Intelligent universal exam security and conduct platform.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-gray-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
