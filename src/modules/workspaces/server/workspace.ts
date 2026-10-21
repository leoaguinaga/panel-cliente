import { cookies } from 'next/headers';

/** Espacio activo del panel: «all», «foxcode» o el id de un producto. El backend lo lee de la misma cookie. */
export const WORKSPACE_COOKIE = 'workspace';
export type WorkspaceValue = 'all' | 'foxcode' | (string & {});

export const isWorkspaceValue = (value: string) => value === 'all' || value === 'foxcode' || /^[a-z0-9]{10,40}$/i.test(value);

export async function getActiveWorkspace(): Promise<WorkspaceValue> {
  const value = (await cookies()).get(WORKSPACE_COOKIE)?.value ?? 'all';
  return isWorkspaceValue(value) ? value : 'all';
}
