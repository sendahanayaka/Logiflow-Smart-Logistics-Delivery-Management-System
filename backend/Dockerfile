# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the solution and restore dependencies
COPY LogiFlow.sln ./
COPY src/LogiFlow.Api/LogiFlow.Api.csproj src/LogiFlow.Api/
COPY src/LogiFlow.Application/LogiFlow.Application.csproj src/LogiFlow.Application/
COPY src/LogiFlow.Domain/LogiFlow.Domain.csproj src/LogiFlow.Domain/
COPY src/LogiFlow.Infrastructure/LogiFlow.Infrastructure.csproj src/LogiFlow.Infrastructure/
RUN dotnet restore

# Copy all source code and publish
COPY . ./
RUN dotnet publish src/LogiFlow.Api/LogiFlow.Api.csproj -c Release -o /out

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /out ./

# Expose port and start
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "LogiFlow.Api.dll"]
