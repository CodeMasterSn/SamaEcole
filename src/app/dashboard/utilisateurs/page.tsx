'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  UserCheck, 
  UserX,
  Search,
  MoreHorizontal,
  Send,
  X,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import InvitationActions from '@/components/invitations/InvitationActions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  obtenirUtilisateursEcole, 
  obtenirInvitations,
  modifierStatutUtilisateur,
  modifierRoleUtilisateur,
  annulerInvitation,
  renvoyerInvitation,
  supprimerUtilisateur,
  type UtilisateurEcole,
  type Invitation
} from '@/lib/supabase-functions';
import InvitationModal from '@/components/modals/InvitationModal';

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurEcole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('utilisateurs');
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationsMasquees, setInvitationsMasquees] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Statistiques calculées
  const stats = {
    totalUtilisateurs: utilisateurs.length,
    utilisateursActifs: utilisateurs.filter(u => u.actif).length,
    utilisateursSuspendus: utilisateurs.filter(u => !u.actif).length,
    invitationsEnAttente: invitations.filter(i => i.statut === 'envoye').length
  };

  // Charger les données
  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const ecoleId = 1; // Pour l'instant, une seule école
      
      const [utilisateursData, invitationsData] = await Promise.all([
        obtenirUtilisateursEcole(ecoleId),
        obtenirInvitations(ecoleId)
      ]);

      setUtilisateurs(utilisateursData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Filtrer les données selon la recherche
  const utilisateursFiltres = utilisateurs.filter(u =>
    `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invitationsFiltrees = invitations.filter(i =>
    !invitationsMasquees.has(i.id) && (
      i.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Actions sur les utilisateurs
  const toggleStatutUtilisateur = async (userId: number, nouvelEtat: boolean) => {
    try {
      await modifierStatutUtilisateur(userId, nouvelEtat);
      await chargerDonnees();
      toast({
        title: "Succès",
        description: `Utilisateur ${nouvelEtat ? 'activé' : 'suspendu'} avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const changerRoleUtilisateur = async (userId: number, nouveauRole: string) => {
    try {
      await modifierRoleUtilisateur(userId, nouveauRole);
      await chargerDonnees();
      toast({
        title: "Succès",
        description: "Rôle modifié avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  };

  // Les actions sur les invitations sont maintenant gérées par le composant InvitationActions

  // Masquer une invitation de la liste (visuellement seulement)
  const masquerInvitation = (invitationId: number) => {
    setInvitationsMasquees(prev => new Set([...prev, invitationId]));
    toast({
      title: "Invitation masquée",
      description: "L'invitation a été masquée de la liste. Elle reste dans la base de données.",
    });
  };

  // Restaurer une invitation masquée
  const restaurerInvitation = (invitationId: number) => {
    setInvitationsMasquees(prev => {
      const newSet = new Set(prev);
      newSet.delete(invitationId);
      return newSet;
    });
    toast({
      title: "Invitation restaurée",
      description: "L'invitation a été restaurée dans la liste.",
    });
  };

  // Supprimer un utilisateur
  const supprimerUtilisateurAction = async (utilisateurId: string, nomUtilisateur: string) => {
    // Demander confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'utilisateur "${nomUtilisateur}" ?\n\nCette action est irréversible et supprimera définitivement l'utilisateur du système.`
    );

    if (!confirmed) return;

    try {
      const result = await supprimerUtilisateur(utilisateurId);
      
      if (result.success) {
        toast({
          title: "Utilisateur supprimé !",
          description: `L'utilisateur "${nomUtilisateur}" a été supprimé avec succès.`,
        });
        await chargerDonnees(); // Rafraîchir la liste
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  // Fonction pour obtenir les initiales
  const getInitiales = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'default';
      case 'accepte': return 'default';
      case 'expire': return 'secondary';
      case 'annule': return 'destructive';
      default: return 'default';
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'envoye': return <Clock className="h-4 w-4" />;
      case 'accepte': return <CheckCircle className="h-4 w-4" />;
      case 'expire': return <AlertCircle className="h-4 w-4" />;
      case 'annule': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les utilisateurs et les invitations de votre établissement
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowInvitationModal(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUtilisateurs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.utilisateursActifs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invitations en attente</CardTitle>
            <Mail className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.invitationsEnAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs suspendus</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.utilisateursSuspendus}</div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="utilisateurs">Utilisateurs actifs</TabsTrigger>
          <TabsTrigger value="invitations">Invitations en attente</TabsTrigger>
        </TabsList>

        {/* Onglet Utilisateurs */}
        <TabsContent value="utilisateurs" className="space-y-4">
          {utilisateursFiltres.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {utilisateursFiltres.map((utilisateur) => (
                <Card key={utilisateur.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitiales(utilisateur.prenom, utilisateur.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {utilisateur.prenom} {utilisateur.nom}
                          </h3>
                          <p className="text-sm text-gray-600">{utilisateur.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{utilisateur.role}</Badge>
                            <Badge 
                              variant={utilisateur.actif ? "default" : "destructive"}
                            >
                              {utilisateur.actif ? "Actif" : "Suspendu"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>Dernière connexion</p>
                          <p>{utilisateur.last_sign_in_at ? 
                            new Date(utilisateur.last_sign_in_at).toLocaleDateString() : 
                            'Jamais'
                          }</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleStatutUtilisateur(utilisateur.id, !utilisateur.actif)}
                            >
                              {utilisateur.actif ? "Suspendre" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => changerRoleUtilisateur(
                                utilisateur.id, 
                                utilisateur.role === 'secretaire' ? 'comptable' : 'secretaire'
                              )}
                            >
                              Changer le rôle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => supprimerUtilisateurAction(utilisateur.id, `${utilisateur.prenom} ${utilisateur.nom}`)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Supprimer l'utilisateur
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Invitations */}
        <TabsContent value="invitations" className="space-y-4">
          {/* Bouton pour restaurer les invitations masquées */}
          {invitationsMasquees.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      {invitationsMasquees.size} invitation(s) masquée(s)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInvitationsMasquees(new Set());
                      toast({
                        title: "Invitations restaurées",
                        description: "Toutes les invitations masquées ont été restaurées.",
                      });
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restaurer tout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {invitationsFiltrees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {invitationsMasquees.size > 0 
                    ? "Aucune invitation visible (certaines sont masquées)" 
                    : "Aucune invitation en attente"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitationsFiltrees.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {invitation.nom_complet.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{invitation.nom_complet}</h3>
                          <p className="text-sm text-gray-600">{invitation.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{invitation.role}</Badge>
                            <Badge variant={getBadgeVariant(invitation.statut)}>
                              <span className="flex items-center space-x-1">
                                {getStatutIcon(invitation.statut)}
                                <span className="ml-1">{invitation.statut}</span>
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>Expire le</p>
                          <p>{new Date(invitation.date_expiration).toLocaleDateString()}</p>
                          <p className="text-xs">
                            Invité par {invitation.invite_par_nom}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {(invitation.statut === 'envoye' || invitation.statut === 'annule') && (
                            <InvitationActions 
                              invitation={invitation}
                              onInvitationDeleted={chargerDonnees}
                            />
                          )}
                          
                          {/* Bouton Masquer */}
                          <button
                            onClick={() => masquerInvitation(invitation.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                            title="Masquer de la liste"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {invitation.message_personnalise && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          <strong>Message:</strong> {invitation.message_personnalise}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal d'invitation */}
      <InvitationModal
        open={showInvitationModal}
        onOpenChange={setShowInvitationModal}
        onSuccess={chargerDonnees}
      />
    </div>
  );
}