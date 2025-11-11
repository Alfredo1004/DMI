# --- Etapa 1: Compilar el Frontend (React) ---
# Usamos una imagen de Node 18 'alpine' (ligera) y la llamamos 'builder'
# 'alpine' es una versión mínima de Linux, ideal para Docker.
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo DENTRO de la imagen
WORKDIR /app/frontend

# Copiamos solo los package.json del frontend para cachear las dependencias
COPY frontend/package.json frontend/package-lock.json ./

# Instalamos las dependencias del frontend
RUN npm install

# Copiamos TODO el código fuente del frontend
COPY frontend/ ./

# Ejecutamos el comando de compilación (esto crea la carpeta /app/frontend/dist)
RUN npm run build
# En este punto, la etapa 'builder' tiene nuestros archivos estáticos en /app/frontend/dist

# --- Etapa 2: Preparar el Backend (Producción) ---
# Empezamos desde una imagen limpia de Node 18.
FROM node:18-alpine

WORKDIR /app

# Copiamos solo los package.json del backend
COPY backend/package.json backend/package-lock.json ./

# Instalamos SOLO las dependencias de producción del backend
# --omit=dev evita instalar 'nodemon' y otras herramientas de desarrollo
RUN npm install --omit=dev

# Copiamos TODO el código fuente del backend
COPY backend/ ./

# *** EL PASO MÁGICO ***
# Copiamos los archivos compilados de React (de la Etapa 'builder')
# a la carpeta 'public' de nuestro backend (la que definimos en server.js)
COPY --from=builder /app/frontend/dist ./public

# Exponemos el puerto 5000 (el que usa nuestro backend) al "mundo exterior" de Docker
EXPOSE 5000

# El comando final para arrancar el servidor cuando se inicie el contenedor
CMD ["node", "server.js"]