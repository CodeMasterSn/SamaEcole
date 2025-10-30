// Test simple pour vérifier la connexion et les tables
// À exécuter dans la console du navigateur sur la page d'édition

async function testSupabaseConnection() {
  console.log('=== TEST CONNEXION SUPABASE ===');
  
  try {
    // Test de connexion de base
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Présent' : 'Manquant');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables d\'environnement manquantes');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Lire un élève
    console.log('\n1. Test lecture élève...');
    const { data: eleve, error: eleveError } = await supabase
      .from('eleves')
      .select('id, nom, prenom')
      .limit(1)
      .single();
    
    if (eleveError) {
      console.error('❌ Erreur lecture élève:', eleveError);
    } else {
      console.log('✅ Élève lu:', eleve);
    }
    
    // Test 2: Vérifier si la table parents existe
    console.log('\n2. Test table parents...');
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select('id, nom, prenom')
      .limit(1);
    
    if (parentsError) {
      console.error('❌ Erreur table parents:', parentsError);
      
      // Test alternative avec parents_tuteurs
      console.log('\n3. Test table parents_tuteurs...');
      const { data: parentsTuteurs, error: parentsTuteursError } = await supabase
        .from('parents_tuteurs')
        .select('id, nom, prenom')
        .limit(1);
      
      if (parentsTuteursError) {
        console.error('❌ Erreur table parents_tuteurs:', parentsTuteursError);
      } else {
        console.log('✅ Table parents_tuteurs existe:', parentsTuteurs);
      }
    } else {
      console.log('✅ Table parents existe:', parents);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testSupabaseConnection();


