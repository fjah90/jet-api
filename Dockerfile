FROM b63defaultcr.azurecr.io/openshift/b-runner-node:latest22

WORKDIR /app
COPY . .

COPY ./devops/scripts/container-post-start.sh /app/post-start.sh
RUN \
    gosu root chmod +x ./post-start.sh

CMD ["npm", "run", "start:prod"]
EXPOSE 3000