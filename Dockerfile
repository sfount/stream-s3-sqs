FROM node@sha256:bba77d0ca8820b43af898b3c50d4e8b68dc703ebbd958319af2f21f2d3c309f5
COPY package.json package-lock.json ./
RUN npm ci --no-progress
COPY src/ src
COPY tsconfig.json tsconfig.json
RUN npm run build
RUN npm prune --production

ENV AWSCLI_VERSION "1.14.10"

RUN apk add --update \
		curl \
    python \
    python-dev \
    py-pip \
    build-base \
    && pip install awscli==$AWSCLI_VERSION --upgrade --user \
    && apk --purge -v del py-pip \
    && rm -rf /var/cache/apk/*

# USER node
CMD [ "npm", "start" ]