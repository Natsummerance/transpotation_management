import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '智慧交通系统',
  description: '学期实训第九小组作品',
  generator: '第九组',
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}