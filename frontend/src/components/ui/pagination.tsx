interface PaginationProps {
  current: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const isActive = page === current;
        return (
          <button
            key={page}
            type="button"
            aria-label={`Página ${page}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(page)}
            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              isActive
                ? 'bg-white/10 font-bold text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {page}
          </button>
        );
      })}
    </nav>
  );
}
