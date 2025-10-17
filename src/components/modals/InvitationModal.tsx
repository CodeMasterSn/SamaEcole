'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { creerInvitation, type InvitationData } from '@/lib/supabase-functions';
import { sendInvitationEmail, sanitizeEmailData, generateEmailPreview } from '@/utils/email-service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, User, MessageSquare } from 'lucide-react';

interface InvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InvitationModal({ open, onOpenChange, onSuccess }: InvitationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvitationData>({
    email: '',
    nom_complet: '',
    role: 'secretaire',
    message_personnalise: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.nom_complet) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Début du processus d\'invitation...');
      console.log('📝 Données reçues:', formData);

      // 1. Créer l'invitation en base de données
      const result = await creerInvitation(formData);
      
      if (!result.success || !result.data) {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de la création de l'invitation",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Invitation créée en base:', result.data);

      // 2. Préparer les données pour l'email
      const emailData = sanitizeEmailData({
        email: formData.email,
        nom: formData.nom_complet,
        token: result.data.token,
        ecole: "Mon École", // TODO: Récupérer le vrai nom depuis le contexte/state
        invitePar: user?.nom_complet || "L'Administrateur",
        role: formData.role,
        messagePersonnalise: formData.message_personnalise
      });

      if (!emailData) {
        throw new Error('Impossible de préparer les données pour l\'email');
      }

      // 3. Aperçu dans les logs (développement)
      if (process.env.NODE_ENV === 'development') {
        console.log(generateEmailPreview(emailData));
      }

      console.log('📧 Tentative d\'envoi email...');

      // 4. Envoyer l'email via Resend
      const emailResult = await sendInvitationEmail(emailData);

      if (!emailResult.success) {
        // L'invitation existe en base mais l'email a échoué
        console.warn('⚠️ Invitation créée mais email non envoyé:', emailResult.error);
        toast({
          title: "Invitation créée",
          description: `Invitation créée mais email non envoyé: ${emailResult.error}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Email envoyé avec succès!');
        console.log('📊 ID du message:', emailResult.messageId);
        toast({
          title: "Succès",
          description: "✅ Invitation envoyée avec succès par email !",
        });
      }

      // 5. Actions post-envoi
      setFormData({
        email: '',
        nom_complet: '',
        role: 'secretaire',
        message_personnalise: ''
      });
      
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('❌ Erreur lors du processus d\'invitation:', error);
      
      // Message d'erreur spécifique selon le type d'erreur
      let errorMessage = 'Erreur lors de l\'invitation';
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = `Erreur email: ${error.message}`;
        } else if (error.message.includes('database') || error.message.includes('base')) {
          errorMessage = `Erreur base de données: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur",
        description: `❌ ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvitationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <span>Inviter un utilisateur</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Envoyez une invitation pour qu'un nouvel utilisateur rejoigne votre établissement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="nom_complet" className="text-sm font-medium">Nom complet *</Label>
            <Input
              id="nom_complet"
              type="text"
              placeholder="Prénom Nom"
              value={formData.nom_complet}
              onChange={(e) => handleInputChange('nom_complet', e.target.value)}
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">Rôle *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'secretaire' | 'comptable') => handleInputChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secretaire">
                  <span className="font-medium">Secrétaire</span>
                </SelectItem>
                <SelectItem value="comptable">
                  <span className="font-medium">Comptable</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Message de bienvenue..."
              value={formData.message_personnalise}
              onChange={(e) => handleInputChange('message_personnalise', e.target.value)}
              rows={2}
              disabled={loading}
              className="resize-none"
            />
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
