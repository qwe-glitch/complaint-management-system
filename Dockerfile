# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy source
COPY . .

# Restore and publish
RUN dotnet restore "Complaint Management System.csproj"
RUN dotnet publish "Complaint Management System.csproj" -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/out .

# Render sets PORT env; listen on it
# Use bash -c to expand $PORT at runtime
CMD ["bash", "-c", "ASPNETCORE_URLS=http://0.0.0.0:$PORT dotnet \"Complaint Management System.dll\""]
