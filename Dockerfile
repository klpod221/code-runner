FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Define ARGs for language versions
ARG NODEJS_VERSION=20
ARG PYTHON_VERSION=3
ARG JAVA_VERSION=17
ARG CPP_VERSION=11
ARG C_VERSION=11

# Install common dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js based on ARG
RUN curl -sL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash - && \
    apt-get update && apt-get install -y nodejs

# Install Python based on ARG
RUN apt-get update && \
    apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-pip

# Install Java based on ARG
RUN apt-get update && \
    apt-get install -y openjdk-${JAVA_VERSION}-jdk

# Install GCC/G++ (C/C++) based on ARG
RUN apt-get update && \
    apt-get install -y gcc-${CPP_VERSION} g++-${CPP_VERSION} && \
    update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-${C_VERSION} 100 && \
    update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-${CPP_VERSION} 100
    
# Install musl for C compilation
RUN apt-get update && apt-get install -y musl musl-dev && \
    rm -rf /var/lib/apt/lists/*

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