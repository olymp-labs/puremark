# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY nextjs-secure-config/nextjs-secure-config.tgz /temp/dev/nextjs-secure-config/nextjs-secure-config.tgz
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY nextjs-secure-config/nextjs-secure-config.tgz /temp/prod/nextjs-secure-config/nextjs-secure-config.tgz
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
ARG COMMIT_HASH="unknown"

COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN rm -rf nextjs-secure-config

# optional tests & build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_COMMIT_HASH=$COMMIT_HASH
#RUN bun test
RUN bun run build
RUN mkdir -p db

# copy production dependencies and source code into final image
FROM base AS release
RUN useradd --system --uid 1001 nextjs
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json .
# automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=prerelease /usr/src/app/public ./public
COPY --from=prerelease --chown=nextjs:bun /usr/src/app/.next/standalone ./
COPY --from=prerelease --chown=nextjs:bun /usr/src/app/.next/static ./.next/static
COPY --from=prerelease --chown=nextjs:bun /usr/src/app/db ./db

ENV NEXT_TELEMETRY_DISABLED=1

# run the app
USER nextjs
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "server.js" ]
