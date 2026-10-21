/** Foto subida desde Mi perfil: `User.image` guarda `avatar:<clave>` y el archivo se sirve por el backend. */
export function avatarSrc(user?: { id?: string | null; image?: string | null } | null) {
  if (!user?.id || !user.image?.startsWith('avatar:')) return null;
  return `/api/backend/users/${encodeURIComponent(user.id)}/avatar?v=${encodeURIComponent(user.image.slice(7, 15))}`;
}

export function initialsOf(name?: string | null, fallback = 'FX') {
  return (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || fallback;
}
