FROM node:22-bookworm-slim

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node package*.json ./
USER node
RUN npm install && mkdir -p /app/.next

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
