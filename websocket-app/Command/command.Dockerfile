# Use a base image
FROM node:latest

# Set the locale environment to ensure proper UTF-8 encoding
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files from the websocket-app directory to the working directory
COPY ./package*.json ./

# Install the dependencies
RUN npm install
RUN npm install axios

# Copy all files from the websocket-app directory to the working directory inside the container
COPY . .

# Expose the ports the application will use
EXPOSE 7070
EXPOSE 3030

# Command to start the application
CMD ["npm", "start"]
