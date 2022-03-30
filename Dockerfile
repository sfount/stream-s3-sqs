FROM node:16.14.2-alpine3.15@sha256:5e20a4e2e52daa1743006c224f2971b1218201e284d17c6eff4a696c9020f1a2
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]
