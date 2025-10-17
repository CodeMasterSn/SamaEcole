import bcrypt from 'bcryptjs';

/**
 * Hash un mot de passe avec bcryptjs
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    console.log("🔐 Password hashé avec succès, longueur:", hashedPassword.length);
    return hashedPassword;
  } catch (error) {
    console.error("❌ Erreur hashage password:", error);
    throw new Error("Erreur lors du hashage du mot de passe");
  }
};

/**
 * Vérifie un mot de passe contre son hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    if (!password || !hash) {
      console.log("❌ Password ou hash manquant");
      return false;
    }
    
    const isValid = await bcrypt.compare(password.trim(), hash);
    console.log("🔍 Vérification password:", isValid ? "✅ VALIDE" : "❌ INVALIDE");
    return isValid;
  } catch (error) {
    console.error("❌ Erreur vérification password:", error);
    return false;
  }
};

/**
 * Teste si un hash est au bon format bcrypt
 */
export const isValidBcryptHash = (hash: string): boolean => {
  const bcryptPattern = /^\$2[aby]\$\d+\$.{53}$/;
  return bcryptPattern.test(hash);
};

/**
 * Debug - Affiche des infos détaillées sur un hash
 */
export const debugHash = (hash: string, label: string = "Hash") => {
  console.log(`🔍 === DEBUG ${label.toUpperCase()} ===`);
  console.log("Hash:", hash);
  console.log("Longueur:", hash?.length || 0);
  console.log("Format valide:", isValidBcryptHash(hash) ? "✅ OUI" : "❌ NON");
  console.log("Commence par:", hash?.substring(0, 10) || "N/A");
  console.log("=== FIN DEBUG ===");
};




