FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
RUN npm install --global pnpm@10.18.3
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
ENV VITE_API_URL=/
RUN pnpm exec tsc --noEmit && pnpm test && pnpm build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
RUN mvn -B clean package -Pwith-frontend -Dtest=AuthenticationIntegrationTest

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=backend --chown=app:app /app/backend/target/stock-manager-0.0.1-SNAPSHOT.jar ./app.jar
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=50 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
