'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  validerTokenInvitation, 
  creerUtilisateurDepuisInvitation,
  type Invitation 
} from '@/lib/supabase-functions';
import { 
  UserCheck, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function RejoindreTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const token = params.token as string;

  // Valider le token au chargement
  useEffect(() => {
    const validerToken = async () => {
      if (!token) {
        setValidationError('Token d\'invitation manquant');
        setLoading(false);
        return;
      }

      try {
        const result = await validerTokenInvitation(token);
        
        if (result.success && result.invitation) {
          setInvitation(result.invitation);
        } else {
          setValidationError(result.error || 'Token invalide');
        }
      } catch (error) {
        console.error('Erreur validation token:', error);
        setValidationError('Erreur lors de la validation du token');
      } finally {
        setLoading(false);
      }
    };

    validerToken();
  }, [token]);

  // Créer le compte utilisateur
  const handleCreerCompte = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des mots de passe
    if (motDePasse.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    if (motDePasse !== confirmMotDePasse) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const result = await creerUtilisateurDepuisInvitation(token, motDePasse);
      
      if (result.success) {
        if (result.needsConfirmation) {
          toast({
            title: "Compte créé !",
            description: "Vérifiez votre email pour confirmer votre compte avant de vous connecter.",
            duration: 8000,
          });
          
          // Afficher un message de confirmation email
          setConfirmationMessage("Un email de confirmation a été envoyé à votre adresse. Vérifiez votre boîte mail et cliquez sur le lien pour activer votre compte.");
          setCreating(false);
          return;
        } else {
          toast({
            title: "Compte créé !",
            description: "Votre compte a été créé avec succès. Redirection vers la connexion...",
          });
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de créer le compte",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur création compte:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du compte",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'envoye':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'accepte':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expire':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'annule':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatutText = (statut: string) => {
    switch (statut) {
      case 'envoye':
        return 'En attente d\'activation';
      case 'accepte':
        return 'Déjà acceptée';
      case 'expire':
        return 'Expirée';
      case 'annule':
        return 'Annulée';
      default:
        return 'Statut inconnu';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Validation de votre invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage du message de confirmation email
  if (confirmationMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-blue-600">Compte créé avec succès !</CardTitle>
            <CardDescription>{confirmationMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Prochaines étapes :</strong>
              </p>
              <ol className="text-sm text-blue-600 mt-2 space-y-1">
                <li>1. Vérifiez votre boîte mail</li>
                <li>2. Cliquez sur le lien de confirmation</li>
                <li>3. Connectez-vous avec vos identifiants</li>
              </ol>
            </div>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Aller à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invitation invalide</CardTitle>
            <CardDescription>{validationError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full"
              variant="outline"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation introuvable</CardTitle>
            <CardDescription>Aucune invitation trouvée pour ce token</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitation.statut !== 'envoye') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {getStatutIcon(invitation.statut)}
            </div>
            <CardTitle>Invitation {getStatutText(invitation.statut)}</CardTitle>
            <CardDescription>
              {invitation.statut === 'accepte' && 'Cette invitation a déjà été utilisée.'}
              {invitation.statut === 'expire' && 'Cette invitation a expiré. Contactez votre administrateur.'}
              {invitation.statut === 'annule' && 'Cette invitation a été annulée.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full"
              variant="outline"
            >
              Aller à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Bienvenue dans SAMA ÉCOLE</CardTitle>
          <CardDescription>
            Créez votre compte pour rejoindre l'établissement
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations de l'invitation */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{invitation.nom_complet}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">{invitation.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                Rôle: <span className="font-medium capitalize">{invitation.role}</span>
              </span>
            </div>
            {invitation.message_personnalise && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                <p className="text-sm text-gray-700">
                  <strong>Message de {invitation.invite_par_nom || 'l\'administrateur'}:</strong>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {invitation.message_personnalise}
                </p>
              </div>
            )}
          </div>

          {/* Formulaire de création de compte */}
          <form onSubmit={handleCreerCompte} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Choisissez un mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  minLength={6}
                  disabled={creating}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={creating}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Au moins 6 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmMotDePasse}
                onChange={(e) => setConfirmMotDePasse(e.target.value)}
                required
                disabled={creating}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>
          </form>

          {/* Expiration */}
          <div className="text-center text-xs text-gray-500">
            <p>Cette invitation expire le {new Date(invitation.date_expiration).toLocaleDateString('fr-FR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
