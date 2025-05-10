# Build frontend (React)
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build backend (Express)
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Final image: serve React + run Express
FROM node:18-alpine
WORKDIR /app
COPY --from=client-build /app/client/build ./client/build
COPY --from=server-build /app/server .
EXPOSE 3001
CMD ["node", "index.js"]
