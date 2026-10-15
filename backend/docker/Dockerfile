FROM node:22-bookworm-slim

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node package*.json ./
USER node
RUN npm install

COPY --chown=node:node . .

EXPOSE 8000

CMD ["npm", "run", "start:dev"]
