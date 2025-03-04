FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 5000

# Run migrations and start the prod build server
CMD echo "Running DB Migrations for Node.js..." && \
    npx sequelize-cli db:migrate  && \
    npx sequelize-cli db:seed:all  && \
    echo "Starting Backend Server for Node.js..." && \
    node dist/main.js
