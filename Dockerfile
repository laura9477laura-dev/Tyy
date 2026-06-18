FROM node:18-bullseye

# Install dependencies for FFmpeg and Sharp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create volume for session and data persistence
VOLUME ["/app/session", "/app/data"]

# Default command
CMD ["npm", "start"]
