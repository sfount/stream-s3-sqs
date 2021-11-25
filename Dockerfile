FROM node:12.22.7-alpine3.14@sha256:3a8ee0d3482bc9139a3554821936379cac9b4a01135ca34ddcf6505b6631ce12
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]
