FROM node:latest

WORKDIR /app
COPY . /app
RUN yarn
RUN yarn build
COPY ./devops/scripts/container-post-start.sh /app/post-start.sh
USER root
RUN chmod +x ./post-start.sh

CMD ["yarn", "start:prod"]
