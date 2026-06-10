# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so dependency layers are cached between builds
COPY LearnOnline/LearnOnline.csproj LearnOnline/
RUN dotnet restore LearnOnline/LearnOnline.csproj

COPY LearnOnline/ LearnOnline/
RUN dotnet publish LearnOnline/LearnOnline.csproj -c Release -o /app/publish

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Listen on 5299 to match the frontend's default API base URL
ENV ASPNETCORE_URLS=http://+:5299
EXPOSE 5299

ENTRYPOINT ["dotnet", "LearnOnline.dll"]
