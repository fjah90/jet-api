# ibero-jet-backend

## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them :

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Docker](https://docs.docker.com/docker-for-windows/install/) or [Docker Toolbox](https://github.com/docker/toolbox/releases)
- [Nest CLI](https://docs.nestjs.com/cli/overview)

---

### Installation

1. Install NPM dependencies

   ```bash
   npm i
   ```

   or

   ```bash
   yarn
   ```

2. Copy `.sample-env` to `.env`

   ```bash
   cp .sample-dist .env
   ```

3. Replace the values of the variables with your own

4. Make husky executable

   ```bash
    chmod ug+x .husky/*
   ```

5. Create Docker images and launch them (inside docker folder)

   ```bash
   docker-compose up -d
   ```

6. Start the project

   ```bash
   npm run start
   ```

---

## Initialize Postgres DB

All the Postgres configurations needed can be found in the docker folder.

## What's in the box ?

---

### Commitizen

[commitizen](https://github.com/commitizen/cz-cli) is a command line utility that makes it easier to create commit messages following the [conventional commit format](https://conventionalcommits.org) specification.

Use `git cz` instead of `git commit` to use commitizen.

[![Add and commit with Commitizen](https://github.com/commitizen/cz-cli/raw/master/meta/screenshots/add-commit.png)](https://github.com/commitizen/cz-cli/raw/master/meta/screenshots/add-commit.png)

**Configuration file**: [`.czrc`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.czrc).

---

### Commitlint

[commitlint](https://github.com/conventional-changelog/commitlint) checks if your commit messages meet the [conventional commit format](https://conventionalcommits.org).

**Configuration file**: [`.commitlintrc.json`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.commitlintrc.json).

In general the pattern mostly looks like this:

```sh
type(scope?): subject  #scope is optional
```

Are you a good `commitizen` ?

---

### Docker Compose

**Compose file**: [`docker-compose.yml`](https://github.com/smarlhens/nest7-boilerplate/blob/master/docker-compose.yml).

Containers :

- PostgreSQL 14
- pgAdmin 6

Compose file uses `.env`.

---

### ESLint

[ESLint](https://eslint.org/) is a fully pluggable tool for identifying and reporting on patterns in JavaScript.

**Configuration file**: [`.eslintrc.js`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.eslintrc.js).

For more configuration options and details, see the [configuration docs](https://eslint.org/docs/user-guide/configuring).

---

### Lint-staged

[Lint-staged](https://github.com/okonet/lint-staged) is a Node.js script that allows you to run arbitrary scripts against currently staged files.

**Configuration file**: [`.lintstagedrc.json`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.lintstagedrc.json).

---

### Prettier

[Prettier](https://prettier.io/) is an opinionated code formatter.

**Configuration file**: [`.prettierrc`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.prettierrc).  
**Ignore file**: [`.prettierignore`](https://github.com/smarlhens/nest7-boilerplate/blob/master/.prettierignore).

For more configuration options and details, see the [configuration docs](https://prettier.io/docs/en/configuration.html).

---

## Running the app

### development

```bash
npm run start
```

### watch mode

```bash
npm run start:dev
```

### production mode

```bash
npm run start:prod
```

---

## Code scaffolding

Run `nest generate|g <schematic> <name> [options]` to generate a new Nest Element.

---

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

---

## Test

### unit tests

```bash
npm run test
```

### e2e tests

```bash
npm run test:e2e
```

### test coverage

```bash
npm run test:cov
```

---

## Releases

Run `npm run release` to create a new release, update the changelog and bumping the package version.
Run `git push --follow-tags origin main` to push the new tag.

---

## Using Migrations

### Generate migration file

The migration generation script will compare the current database schema against the current entities definition.
In order to generate the difference it will look for this entities in the ./dist folder, so it is needed to
build the application first in order to generate the correct migration script

So first:

> npm run build

After that

> npm run migration:generate -- -n [migrationName]

To generate the correct migration file.

### Run migration

This command will run the pending migration files, it will compare the migrations table in the database against the
migration files located in the /dist/migration folder. This means that the application needs to be built in order to
run the migration manually.

> npm run migration:run

### Revert migration

This command will revert the last migration execution, it will take into account the migration files located in the /dist/migration folder. This means that the application needs to be built in order to run the migration manually.

> npm run migration:revert

### Create empty migration file

This command will create a new migration, it will take into account the migration files located in the /dist/migration folder. This means that the application needs to be built in order to run the migration manually.

> npm run migration:create -- -n [migrationName]

## Local development configuration

Most of the configurations needed are set by default, to check which environment variables can be set or which are
mandatory look into the /.sample-env file. Create a .env file into the root folder with the configurations needed
and start the project with.

```sh
   npm run start
```

## Authentication examples

### SignUp (curl)

```sh
   curl --location --request POST 'http://localhost:4000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@test.com",
    "username": "username1234",
    "password": "Password.1"
}'
```

### SignIn (curl)

```sh
curl --location --request POST 'http://localhost:4000/auth/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@test.com",
    "password": "Password.1"
}'
```

### Api with credentials (curl)

```sh
curl --location --request GET 'http://localhost:4000/auth/test' \
--header 'Authorization: Bearer {{token}}'
```

## TODO

1. Logger
   - Use logger provide from NestJS.
   - Logstash, GCloudLogs if possible.
   - Logging into files with rotation.
   - Log inbound request.
   - Log outbound request.
   - Logger Configuration by env vars
2. Authorization/ac/roles/AdminUser
3. Entity Auditable
4. TypeORM Soft Deletion
5. Transactions at Service Layer
6. Axios-Retry (configuration for micro-services communication)
