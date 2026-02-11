FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install
COPY apps/api ./apps/api
CMD ["npm", "run", "start", "-w", "apps/api"]
