FROM node:18-alpine

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias  
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3002

# Comando por defecto
CMD ["npm", "start"]