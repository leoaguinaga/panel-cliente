import { requireAuth } from '@/src/lib/auth';
import { ProfileWorkspace } from '@/src/modules/profile/ProfileWorkspace';
import { getPreferences, getProfile, getProfileSessions } from '@/src/modules/profile/server/queries';

export default async function ProfilePage() {
  await requireAuth(['ADMIN', 'WORKER']);
  const [profile, sessions, preferences] = await Promise.all([getProfile(), getProfileSessions(), getPreferences()]);
  return <ProfileWorkspace profile={profile} sessions={sessions} hourFormat={preferences.hourFormat} />;
}
