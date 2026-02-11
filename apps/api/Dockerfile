FROM node:20-alpine
WORKDIR /app
COPY . /app
RUN npm install --workspaces && npm run -w @clawbot/shared build && npm run -w @clawbot/api prisma:generate && npm run -w @clawbot/api build
CMD ["sh", "-c", "npm run -w @clawbot/api prisma:migrate && npm run -w @clawbot/api start"]
