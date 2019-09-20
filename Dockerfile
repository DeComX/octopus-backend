FROM node:10.16.3-alpine

EXPOSE 5000

USER root

COPY . /data

RUN mkdir -p /data/files

WORKDIR /data

RUN npm install

ENTRYPOINT ["node", "server.js"]
