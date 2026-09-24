FROM node:22-alpine AS dependencies

WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

FROM dependencies AS development

COPY apps/web/ ./
EXPOSE 8081
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8081"]

FROM dependencies AS build

COPY apps/web/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY deployments/docker/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8081
