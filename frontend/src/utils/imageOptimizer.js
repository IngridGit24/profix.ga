// src/utils/imageOptimizer.js

/**
 * Optimiser une URL Cloudinary
 * @param {string} url - L'URL Cloudinary
 * @param {number} width - Largeur souhaitée
 * @param {number} height - Hauteur souhaitée (optionnel)
 * @param {string} quality - Qualité (auto, 80, 90, 100)
 * @param {string} format - Format (auto, webp, jpg, png)
 * @returns {string} URL optimisée
 */
export const optimizeImage = (url, width = 400, height, quality = 'auto', format = 'auto') => {
  if (!url) return ''
  
  // Si ce n'est pas une URL Cloudinary, retourner l'URL d'origine
  if (!url.includes('cloudinary.com')) return url
  
  // Construire les paramètres de transformation
  let transform = `w_${width}`
  if (height) transform += `,h_${height}`
  transform += `,c_fill`
  transform += `,q_${quality}`
  transform += `,f_${format}`
  
  // Insérer dans l'URL
  return url.replace('/upload/', `/upload/${transform}/`)
}

/**
 * Optimiser une image pour une miniature (avatar)
 */
export const optimizeAvatar = (url) => {
  return optimizeImage(url, 80, 80, 'auto')
}

/**
 * Optimiser une image pour une galerie
 */
export const optimizeGallery = (url) => {
  return optimizeImage(url, 300, 300, 'auto')
}

/**
 * Optimiser une image pour un hero
 */
export const optimizeHero = (url) => {
  return optimizeImage(url, 1200, 600, 'auto')
}