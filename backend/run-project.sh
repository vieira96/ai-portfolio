#!/usr/bin/env bash
set -euo pipefail

# Sobe o ambiente completo do backend: deps, Docker, Postgres,
# extensão pgcrypto, migrations, seed e a API.
#
# Uso: ./run-project.sh (a partir da pasta backend/)

cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE_FILE="docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker não foi encontrado. Instale o Docker Engine ou Docker Desktop antes de continuar."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "O plugin Docker Compose não foi encontrado."
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Node não foi encontrado. Instale via nvm e rode 'nvm use' na pasta backend/."
    exit 1
fi

if [[ "$(node -v)" != v22* ]]; then
    echo "Aviso: este projeto usa Node 22 (backend/.nvmrc), mas o ativo é $(node -v)."
    echo "Rode 'nvm use' antes de continuar ou aguarde possíveis erros de engine."
fi

echo "Instalando dependências..."
npm install

if [[ ! -f .env ]]; then
    cp .env.example .env
    echo "Arquivo .env criado a partir de .env.example. Revise os valores antes de seguir."
fi

echo "Subindo PostgreSQL e Redis..."
docker compose -f "$COMPOSE_FILE" up --build -d postgres redis

echo "Aguardando o PostgreSQL ficar saudável..."
for _ in $(seq 1 30); do
    if docker exec docker-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

if ! docker exec docker-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
    echo "O PostgreSQL não ficou saudável a tempo. Veja 'docker logs docker-postgres-1'."
    exit 1
fi

echo "Habilitando extensão pgcrypto (gen_random_uuid dos ids)..."
docker exec docker-postgres-1 psql -U postgres -d portfolio -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' >/dev/null

echo "Aplicando migrations e gerando o Prisma Client..."
npx prisma migrate deploy
npx prisma generate

if [[ -f prisma/seed.ts ]]; then
    echo "Executando seed..."
    npx prisma db seed
fi

echo "Subindo o backend..."
docker compose -f "$COMPOSE_FILE" up --build -d backend

echo
echo "Projeto pronto:"
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "  Logs: tail -f logs/app-$(date +%F).log"
