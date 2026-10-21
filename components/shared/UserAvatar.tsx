import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarSrc, initialsOf } from '@/src/lib/avatar';
import { cn } from '@/lib/utils';

type AvatarUser = { id?: string | null; name?: string | null; image?: string | null };

/** Foto de la persona con sus iniciales de respaldo. `src` permite mostrar una vista previa local. */
export function UserAvatar({ user, src, className, fallbackClassName }: { user?: AvatarUser | null; src?: string | null; className?: string; fallbackClassName?: string }) {
  const image = src === undefined ? avatarSrc(user) : src;
  return <Avatar className={cn('size-8 rounded-lg', className)}>
    {image && <AvatarImage src={image} alt="" />}
    <AvatarFallback className={cn('rounded-[inherit] bg-brand-button font-semibold text-white', fallbackClassName)}>{initialsOf(user?.name)}</AvatarFallback>
  </Avatar>;
}
