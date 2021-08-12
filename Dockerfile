FROM node@sha256:a199f64c814f12fb00fa81a6e1c7f964e260a127f2b64ac526a358f3152c0f66
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production
USER node
CMD [ "npm", "start" ]