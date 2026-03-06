import './globals.css'

export const metadata = { title: '🪵 Marcenaria', description: 'Sistema de gestão da marcenaria' }

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
