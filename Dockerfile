FROM node:12.10.0-alpine

EXPOSE 5000

USER root

COPY . /data

RUN mkdir -p /data/files

WORKDIR /data

RUN npm install

ENTRYPOINT ["node", "server.js"]
