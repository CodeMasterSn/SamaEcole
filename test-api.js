// Test de l'API d'envoi d'invitation
const testAPI = async () => {
  try {
    console.log('🧪 Test de l\'API d\'envoi d\'invitation...');
    
    // Test 1: GET pour vérifier la configuration
    console.log('\n1. Test GET /api/send-invitation');
    const getResponse = await fetch('http://localhost:3000/api/send-invitation', {
      method: 'GET'
    });
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET réussi:', getData);
    } else {
      console.log('❌ GET échoué:', getResponse.status, getResponse.statusText);
    }
    
    // Test 2: POST avec des données de test
    console.log('\n2. Test POST /api/send-invitation');
    const testData = {
      email: 'test@example.com',
      nom: 'Test User',
      ecole: 'École Test',
      invitePar: 'Admin Test',
      role: 'secretaire',
      token: 'test-token-123',
      messagePersonnalise: 'Message de test'
    };
    
    const postResponse = await fetch('http://localhost:3000/api/send-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST réussi:', postData);
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST échoué:', postResponse.status, postResponse.statusText);
      console.log('Erreur:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
};

// Attendre que le serveur soit prêt
setTimeout(() => {
  testAPI();
}, 5000);




