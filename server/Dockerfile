# Import node environment
FROM node:18

# Expose the port
EXPOSE 8080

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy app
COPY src ./src

# Start the app
CMD ["npm", "start"]