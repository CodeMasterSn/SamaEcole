'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { confirmerEmailEtActiverCompte } from '@/lib/supabase-functions';
import { 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Mail
} from 'lucide-react';

export default function ConfirmerEmailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    const confirmerEmail = async () => {
      if (!token) {
        setError('Token de confirmation manquant');
        setLoading(false);
        return;
      }

      try {
        const result = await confirmerEmailEtActiverCompte(token);
        
        if (result.success) {
          setConfirmed(true);
        } else {
          setError(result.error || 'Erreur lors de la confirmation');
        }
      } catch (error) {
        console.error('Erreur confirmation email:', error);
        setError('Une erreur est survenue lors de la confirmation');
      } finally {
        setLoading(false);
      }
    };

    confirmerEmail();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Confirmation de votre email...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Erreur de confirmation</CardTitle>
            <CardDescription>{error}</CardDescription>
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

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Email confirmé !</CardTitle>
            <CardDescription>
              Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Votre compte SAMA ÉCOLE est maintenant actif !
                </span>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Se connecter maintenant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}




