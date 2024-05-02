FROM node:20 AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm config rm proxy
RUN npm config rm https-proxy
RUN npm ci --fetch-timeout=100000
COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src
RUN npm run build

FROM node:20 AS publish
WORKDIR /workspace
# Updating packages and installing cron
RUN apt-get update && apt-get install cron -y
COPY cronfile /etc/cron.d/cronfile
# Giving permission to crontab file
RUN chmod 0644 /etc/cron.d/cronfile
# Registering file to crontab
RUN crontab /etc/cron.d/cronfile
COPY --from=build /workspace/package.json /workspace/package-lock.json ./
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/build ./build
ENTRYPOINT [ "cron", "-f" ]
