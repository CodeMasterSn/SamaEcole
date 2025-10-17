'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supprimerInvitation, renvoyerInvitation } from '@/lib/supabase-functions'

interface InvitationActionsProps {
  invitation: {
    id: number
    email: string
    nom_complet: string
    token: string
    role: string
    statut: string
  }
  onInvitationDeleted: () => void // Callback pour rafraîchir la liste
}

export default function InvitationActions({ invitation, onInvitationDeleted }: InvitationActionsProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Copier le lien d'activation
  const handleCopy = async () => {
    try {
      const activationUrl = `${window.location.origin}/rejoindre/${invitation.token}`
      await navigator.clipboard.writeText(activationUrl)
      toast({
        title: "Lien copié !",
        description: "Le lien d'activation a été copié dans le presse-papiers.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      })
    }
  }

  // Renvoyer l'invitation
  const handleResend = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const result = await renvoyerInvitation(invitation.id)
      
      if (result.success) {
        toast({
          title: "Invitation renvoyée !",
          description: `L'invitation a été renvoyée à ${invitation.email}`,
        })
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors du renvoi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du renvoi de l'invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Supprimer l'invitation avec confirmation
  const handleDelete = async () => {
    if (loading) return

    // Demander confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'invitation de ${invitation.nom_complet} (${invitation.email}) ?\n\nCette action est irréversible.`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const result = await supprimerInvitation(invitation.id)
      
      if (result.success) {
        toast({
          title: "Invitation supprimée !",
          description: "L'invitation a été supprimée avec succès.",
        })
        onInvitationDeleted() // Rafraîchir la liste
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de la suppression",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Bouton Copier - seulement pour les invitations envoyées */}
      {invitation.statut === 'envoye' && (
        <button
          onClick={handleCopy}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          title="Copier le lien d'activation"
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* Bouton Renvoyer - seulement pour les invitations envoyées */}
      {invitation.statut === 'envoye' && (
        <button
          onClick={handleResend}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
          title="Renvoyer l'invitation"
          disabled={loading}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      )}

      {/* Bouton Supprimer - pour toutes les invitations (envoyées et annulées) */}
      <button
        onClick={handleDelete}
        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
        title="Supprimer l'invitation"
        disabled={loading}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  )
}
