FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
