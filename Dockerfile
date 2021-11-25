FROM node:12.22.7-alpine3.14@sha256:b00269389ee255f4129bf4af8a0a1eb3ed16fa37144c20734fb6d93e7c48f5f7
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]
