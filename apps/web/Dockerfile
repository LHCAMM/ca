FROM node:20-alpine
WORKDIR /app
COPY . /app
RUN npm install --workspaces && npm run -w @clawbot/web build
CMD ["npm", "run", "-w", "@clawbot/web", "start"]
