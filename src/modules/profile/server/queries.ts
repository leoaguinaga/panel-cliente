import { backendFetch } from '@/src/lib/api/server';
import type { Profile, ProfileSession } from '../types';

export const getProfile = () => backendFetch<Profile>('/me');
export const getProfileSessions = () => backendFetch<ProfileSession[]>('/me/sessions');
export const getPreferences = () => backendFetch<{ hourFormat: string }>('/settings/preferences');
