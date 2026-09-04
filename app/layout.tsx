import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Model X — Anatomy of Electric', description: 'Take a closer look. An interactive, exploded 3D study of the systems inside Tesla Model X.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" className="dark"><body>{children}</body></html> }
