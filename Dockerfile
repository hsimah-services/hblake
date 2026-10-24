# The site as one image: the built client and the published server. Build from the repository root:
#   docker build -t hblake .
# Settings come from the environment (README, "Operator data procedures"); nothing secret is baked in.

FROM docker.io/library/node:22-bookworm-slim AS client
WORKDIR /repo/client
RUN corepack enable
COPY client/package.json client/pnpm-lock.yaml client/pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY client/ ./
RUN pnpm build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server
WORKDIR /repo
COPY Directory.Build.props ./
COPY src/ src/
RUN dotnet publish src/Hsimah.Server -c Release -o /out --nologo -v quiet

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=server /out ./
COPY --from=client /repo/client/dist ./client/dist
COPY content/pages.json ./content/pages.json
ENV ASPNETCORE_URLS=http://+:8080 \
    HSIMAH_CLIENT=/app/client/dist \
    HSIMAH_CONTENT=/app/content/pages.json
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Hsimah.Server.dll"]
