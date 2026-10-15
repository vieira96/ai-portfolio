import { cache } from 'react';
import { cookies } from 'next/headers';
import type { AuthenticatedUserProfile } from '@/types/users/users.types';
import { backendUrl } from '../backend';

export const getSession = cache(
  async (): Promise<AuthenticatedUserProfile | null> => {
    const token = (await cookies()).get('access_token')?.value;
    if (!token) {
      return null;
    }

    const response = await fetch(backendUrl('/auth/me'), {
      headers: { cookie: `access_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthenticatedUserProfile;
  },
);
