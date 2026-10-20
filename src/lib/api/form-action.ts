 'use server';
import { BackendApiError } from './server';
export async function runFormAction(action: (data: FormData) => Promise<unknown>, data: FormData) {
  try {
    const result = await action(data);
    if (result && typeof result === 'object' && 'ok' in result && result.ok === false && 'error' in result && typeof result.error === 'string')
      return { ok: false, error: result.error };
    return { ok: true, error: null };
  }
  catch (error) { if (error instanceof BackendApiError) return { ok: false, error: error.message }; throw error; }
}
