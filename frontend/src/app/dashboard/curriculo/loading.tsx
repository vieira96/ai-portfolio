export default function ResumeLoading() {
  return (
    <main
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-sm text-slate-400">Carregando dados do currículo...</p>
    </main>
  );
}
