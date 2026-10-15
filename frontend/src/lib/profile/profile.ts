import { backendUrl } from '../backend';
import type { PublicUserProfile } from '@/types/users/users.types';

export async function getPublicProfile(): Promise<PublicUserProfile | null> {
  const response = await fetch(backendUrl('/users/profile'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PublicUserProfile;
}
