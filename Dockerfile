FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    libx11-xcb1 \
    libdrm2 \
    libgbm1 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY desktop/package*.json ./

RUN npm install

COPY desktop/ .

ENV ELECTRON_ENABLE_LOGGING=1
ENV ELECTRON_DISABLE_SECURITY_WARNINGS=true

CMD ["npm", "start"]
