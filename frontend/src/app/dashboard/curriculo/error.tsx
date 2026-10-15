'use client';

export default function ResumeError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <section
        className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6"
        role="alert"
      >
        <h1 className="text-lg font-semibold text-red-100">
          Não foi possível carregar os dados do currículo
        </h1>
        <p className="mt-2 text-sm text-red-200/80">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-red-300/40 px-4 py-2 text-sm text-red-100 transition hover:bg-red-300/10"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
