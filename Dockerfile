FROM node:10.17.0-alpine3.10
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ENTRYPOINT ["/home/node/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
