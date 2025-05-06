FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    gcc \
    g++ \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    musl \
    musl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS version)
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
    
# Install npm (latest version)
RUN npm install -g npm@latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Create directory for code execution
RUN mkdir -p /tmp/code-execution

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]