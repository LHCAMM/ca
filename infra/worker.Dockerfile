FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY apps/worker/package.json ./apps/worker/package.json
RUN npm install
COPY apps/worker ./apps/worker
CMD ["npm", "run", "start", "-w", "apps/worker"]
