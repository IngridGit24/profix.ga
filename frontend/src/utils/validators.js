// src/utils/validators.js

/**
 * Valider un email
 */
export const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  return regex.test(email)
}

/**
 * Valider un mot de passe (min 6 caractères)
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6
}

/**
 * Valider un mot de passe selon la règle du backend (8+ caractères,
 * majuscule, minuscule, chiffre) — voir api-profixgabon authRoutes.js
 * passwordComplexity. Utilisé à l'inscription pour éviter un aller-retour
 * serveur inutile sur un mot de passe qui sera de toute façon rejeté.
 */
export const isStrongPassword = (password) => {
  return (
    !!password &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

/**
 * Valider un nom (min 2 caractères, max 50)
 */
export const isValidName = (name) => {
  return name && name.length >= 2 && name.length <= 50
}

/**
 * Valider une description (min 10 caractères, max 2000)
 */
export const isValidDescription = (desc) => {
  return desc && desc.length >= 10 && desc.length <= 2000
}

/**
 * Valider un montant (positif, max 999999999)
 */
export const isValidMontant = (montant) => {
  return montant && !isNaN(montant) && montant > 0 && montant < 999999999
}

/**
 * Valider un commentaire (min 10 caractères, max 500)
 */
export const isValidComment = (comment) => {
  return comment && comment.length >= 10 && comment.length <= 500
}

/**
 * Sanitizer un texte (XSS protection)
 */
export const sanitizeText = (text) => {
  if (!text) return ''
  // Supprimer les balises HTML
  return text.replace(/<[^>]*>/g, '').trim()
}