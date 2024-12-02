FROM node:21-alpine
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app
RUN npm run build
CMD ["npm", "run", "start:prod"]
EXPOSE 1990
