# 1. Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application (skipping tests for speed)
RUN mvn clean package -DskipTests

# 2. Run Stage
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy the built jar file from the previous stage
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
