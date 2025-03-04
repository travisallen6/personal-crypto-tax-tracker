# Use the official Node.js image as a base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies (including dev dependencies)
RUN npm install --production=false

# Copy the rest of the app's source code into the container
COPY . .

# Build the app
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "run", "start:dev"]