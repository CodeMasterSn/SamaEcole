'use client';

import { useState } from 'react';
import { sendInvitationEmail } from '@/utils/email-service';
import { useToast } from '@/hooks/use-toast';

export default function EmailTestButton() {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email de test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Données de test
      const testData = {
        email: testEmail,
        nom: 'Utilisateur Test',
        token: 'test-token-' + Date.now(),
        ecole: 'École de Test SAMA ÉCOLE',
        invitePar: 'Administrateur Test',
        role: 'secretaire',
        messagePersonnalise: 'Ceci est un message de test pour valider le système d\'envoi d\'emails de SAMA ÉCOLE.'
      };

      console.log('🧪 Envoi email de test...');
      const result = await sendInvitationEmail(testData);

      if (result.success) {
        toast({
          title: "Succès",
          description: `✅ Email de test envoyé avec succès ! ID: ${result.messageId}`,
        });
        console.log('✅ Test réussi:', result);
      } else {
        toast({
          title: "Erreur",
          description: `❌ Échec du test: ${result.error}`,
          variant: "destructive",
        });
        console.error('❌ Test échoué:', result);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: `❌ Erreur test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      console.error('❌ Erreur test email:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-purple-200 max-w-sm z-50">
      <h4 className="text-sm font-semibold text-purple-700 mb-2">🧪 Test Email System</h4>
      
      <input
        type="email"
        placeholder="votre.email@example.com"
        value={testEmail}
        onChange={(e) => setTestEmail(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
      
      <button
        onClick={handleTestEmail}
        disabled={loading || !testEmail}
        className="w-full px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '📤 Envoi...' : '🚀 Tester Email'}
      </button>
      
      <p className="text-xs text-gray-500 mt-1">
        Dev uniquement - Test Resend
      </p>
    </div>
  );
}




