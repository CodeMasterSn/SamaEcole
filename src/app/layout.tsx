import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { EcoleProvider } from "@/contexts/EcoleContext";
import { Toaster } from "@/components/ui/toaster";
import { Poppins } from 'next/font/google'

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: "Sama École - Gestion Scolaire Moderne",
  description: "Plateforme de gestion scolaire complète pour les établissements éducatifs. Gestion des élèves, facturation, paiements, rapports et plus encore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <AuthProvider>
          <EcoleProvider>
            {children}
            <Toaster />
          </EcoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
