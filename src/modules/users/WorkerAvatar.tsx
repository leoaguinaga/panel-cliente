import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Worker } from "@/src/lib/api/contracts";
import styles from "./workers.module.css";

export function WorkerAvatar({
  worker,
  className,
}: {
  worker: Pick<Worker, "id" | "name" | "image">;
  className?: string;
}) {
  const tones = [
    styles.avatarOrange,
    styles.avatarBlue,
    styles.avatarGreen,
    styles.avatarPurple,
  ];
  const hash = Array.from(worker.id).reduce(
    (value, char) => (value * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
  return (
    <UserAvatar
      user={worker}
      className={className}
      fallbackClassName={tones[hash % tones.length]}
    />
  );
}
