# Use official Node image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of backend code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]