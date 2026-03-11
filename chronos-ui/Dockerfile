FROM node:20-slim
WORKDIR /app

# Copy package configurations and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the React code
COPY . .

EXPOSE 5173

# We add --host so the Vite server is accessible outside the Docker container
CMD ["npm", "run", "dev", "--", "--host"]