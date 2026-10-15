import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms/login-form';
import { getSession } from '@/lib/auth/auth';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-ink px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgba(38,101,210,.18),transparent_62%)]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-surface/60 p-8">
        <p className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.18em] text-blue-300">
          <span className="h-px w-8 bg-blue-400" />
          Portfolio AI
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Entrar
        </h1>
        <p className="mb-6 mt-1 text-sm text-slate-400">
          Gerencie seu portfólio.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
