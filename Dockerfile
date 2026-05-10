FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY webServer.js ./
COPY schema ./schema
COPY images ./images

EXPOSE 3001

CMD ["node", "webServer.js"]