FROM node:20-alpine
EXPOSE 3500
WORKDIR /app
RUN apk add --no-cache supervisor
COPY package.json package-lock.json ./
RUN npm ci
COPY seo/package.json seo/package-lock.json seo/
RUN cd seo && npm ci
COPY . .

RUN npx tsx bundleNow.ts
RUN cd seo && npm run build

RUN cat > /etc/supervisord.conf <<EOF
[supervisord]
nodaemon=true

[program:app]
command=npm run startLive
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stderr_logfile=/dev/stderr

[program:seo]
command=sh -c "cd seo && node .output/server/index.mjs"
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stderr_logfile=/dev/stderr

[program:prisma]
command=npx --yes prisma migrate dev --name init
directory=/app
autostart=true
stdout_logfile=/dev/stdout
stderr_logfile=/dev/stderr

EOF


CMD ["supervisord", "-c", "/etc/supervisord.conf"]


