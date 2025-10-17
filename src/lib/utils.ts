import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitaires pour les dates
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR')
}

// Utilitaires pour les montants
export function formatCurrency(amount: number, currency: string = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

// Génération de numéros automatiques
export function generateInvoiceNumber(year: number = new Date().getFullYear()): string {
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `FAC-${year}-${random}`
}

export function genererNumeroFacture(): string {
  const annee = new Date().getFullYear()
  const mois = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `FAC-${annee}${mois}-${random}` // Format: FAC-202501-1234
}

export function generateReceiptNumber(year: number = new Date().getFullYear()): string {
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `REC-${year}-${random}`
}

export function generateMatricule(year: number = new Date().getFullYear()): string {
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `MAT-${year}-${random}`
}