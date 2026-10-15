'use client';

import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { toast } from 'sonner';
import { ImagePicker } from '@/components/ui/inputs/image-picker';
import type { AuthenticatedUserProfile } from '@/types/users/users.types';
import { profileSchema } from './profile.schema';

type ProfileFormInitial = Omit<AuthenticatedUserProfile, 'phone'> & {
  phone?: string | null;
};

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [headline, setHeadline] = useState(initial.headline ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = profileSchema.safeParse({
      name,
      phone,
      headline,
      bio,
      location,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus('saving');

    try {
      let photoUrl = avatarUrl;
      if (pendingAvatar) {
        const formData = new FormData();
        formData.append('file', pendingAvatar);
        formData.append('folder', 'avatars');

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          toast.error('Não foi possível salvar. Tente novamente.', {
            duration: 5000,
          });
          return;
        }

        photoUrl = ((await uploadResponse.json()) as { url: string }).url;
        setAvatarUrl(photoUrl);
        setPendingAvatar(null);
      }

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          ...(photoUrl ? { avatarUrl: photoUrl } : {}),
        }),
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso.', { duration: 5000 });
      } else {
        toast.error('Não foi possível salvar. Tente novamente.', {
          duration: 5000,
        });
      }
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.', {
        duration: 5000,
      });
    } finally {
      setStatus('idle');
    }
  }

  return (
    <form
      id="perfil"
      onSubmit={handleSubmit}
      className="scroll-mt-24 rounded-2xl border border-line bg-surface/60 p-6"
    >
      <div className="mb-4 flex max-w-xs flex-col gap-1.5 text-sm">
        <span className="text-slate-400">Foto de perfil</span>
        <ImagePicker
          key={avatarUrl}
          currentImageUrl={avatarUrl || undefined}
          onSelect={setPendingAvatar}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-slate-400">Nome</span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError('name');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Telefone</span>
          <Input
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              clearFieldError('phone');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-400">{fieldErrors.phone}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Headline</span>
          <Input
            value={headline}
            onChange={(event) => {
              setHeadline(event.target.value);
              clearFieldError('headline');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.headline && (
            <p className="text-xs text-red-400">{fieldErrors.headline}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-slate-400">Bio</span>
          <Textarea
            rows={4}
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
              clearFieldError('bio');
            }}
            className="border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 min-h-0 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.bio && (
            <p className="text-xs text-red-400">{fieldErrors.bio}</p>
          )}
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Localização (Ex: Osasco - SP)</span>
          <Input
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              clearFieldError('location');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.location && (
            <p className="text-xs text-red-400">{fieldErrors.location}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">GitHub</span>
          <Input
            value={githubUrl}
            onChange={(event) => {
              setGithubUrl(event.target.value);
              clearFieldError('githubUrl');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.githubUrl && (
            <p className="text-xs text-red-400">{fieldErrors.githubUrl}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">LinkedIn</span>
          <Input
            value={linkedinUrl}
            onChange={(event) => {
              setLinkedinUrl(event.target.value);
              clearFieldError('linkedinUrl');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.linkedinUrl && (
            <p className="text-xs text-red-400">{fieldErrors.linkedinUrl}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-400">Portfólio</span>
          <Input
            value={portfolioUrl}
            onChange={(event) => {
              setPortfolioUrl(event.target.value);
              clearFieldError('portfolioUrl');
            }}
            className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
          />
          {fieldErrors.portfolioUrl && (
            <p className="text-xs text-red-400">{fieldErrors.portfolioUrl}</p>
          )}
        </label>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button
          type="submit"
          disabled={status === 'saving'}
          className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
        >
          {status === 'saving' ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
