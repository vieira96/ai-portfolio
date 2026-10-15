#!/usr/bin/env bash
set -euo pipefail

# Sobe o ambiente de desenvolvimento do frontend.
#
# Uso: ./run-project.sh (a partir da pasta frontend/)

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
    echo "Node não foi encontrado. Instale via nvm e rode 'nvm use' na pasta frontend/."
    exit 1
fi

if [[ "$(node -v)" != v22* ]]; then
    echo "Aviso: este projeto usa Node 22 (frontend/.nvmrc), mas o ativo é $(node -v)."
    echo "Rode 'nvm use' antes de continuar ou aguarde possíveis erros de engine."
fi

echo "Instalando dependências..."
if [[ ! -d node_modules ]]; then
    npm install
else
    echo "node_modules já existe, pulando install."
fi

if [[ ! -f .env ]]; then
    cp .env.example .env
    echo "Arquivo .env criado a partir de .env.example. Revise os valores antes de seguir."
fi

echo "Subindo o frontend..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo
echo "Projeto pronto:"
echo "  App: http://localhost:3000"
