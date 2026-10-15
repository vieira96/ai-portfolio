'use client';

import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { loginSchema } from './login.schema';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    const parsed = loginSchema.safeParse({ email, password });
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
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        setError('Email ou senha inválidos.');
        return;
      }

      if (!response.ok) {
        setError('Não foi possível entrar. Tente novamente.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-slate-400">Email</span>
        <Input
          type="email"
          autoComplete="email"
          placeholder="voce@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError('email');
          }}
          required
          className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-400">{fieldErrors.email}</p>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-slate-400">Senha</span>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError('password');
          }}
          required
          minLength={8}
          className="h-auto border-line bg-surface px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-0 dark:bg-surface"
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-400">{fieldErrors.password}</p>
        )}
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
