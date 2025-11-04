
// Helper to construct image URL
export function getImageUrl(imageName) {
  if (!imageName) return '';
  // Images are in /static/assets/pokemons_image/official/
  return `/static/assets/pokemons_image/official/${imageName}`;
}
