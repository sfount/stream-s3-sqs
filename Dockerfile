FROM node:16.16.0-alpine3.15@sha256:3cc4a16286bc01e141dcfec735f3ebfaf8bdb6ab7ff216f9a7073bd08cee1fa7
COPY package.json package-lock.json ./
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm ci --no-progress
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]
