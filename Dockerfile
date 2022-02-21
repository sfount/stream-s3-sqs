FROM node:12.22.10-alpine3.15@sha256:f150ebf9402f0dd6a9c4cb208ed64884cfa7c8a6ccae3f749a7b12156c25ad88
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]
