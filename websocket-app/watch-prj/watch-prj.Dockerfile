# Use a base image
FROM node:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files from the websocket-app directory to the working directory
COPY ./package*.json ./

# Install the dependencies
RUN npm install
RUN npm install axios
RUN npm install chokidar
# Copy all files from the websocket-app directory to the working directory inside the container
COPY . .

# Expose the ports the application will use
EXPOSE 8080
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]
