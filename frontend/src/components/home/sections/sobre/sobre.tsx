import Image from 'next/image';

interface SobreProps {
  bio: string;
  photoUrl?: string;
  photoAlt?: string;
}

export function Sobre({ bio, photoUrl, photoAlt }: SobreProps) {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="scroll-mt-20 border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-xs tracking-wide text-slate-500 uppercase">
          Sobre
        </p>
        <h2
          id="sobre-titulo"
          className="my-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl"
        >
          Sobre mim
        </h2>

        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl flex-1">
          <p className="leading-relaxed text-slate-300">{bio}</p>
        </div>
          {photoUrl && (
            <div className="relative mx-auto size-48 shrink-0 sm:size-56">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-accent/20"
              />
              <Image
                src={photoUrl}
                alt={photoAlt ?? 'Foto de perfil'}
                width={176}
                height={176}
                priority
                className="absolute inset-0 m-auto size-40 rounded-full border border-line object-cover sm:size-44"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
