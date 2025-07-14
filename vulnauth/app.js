const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

// VULNERABLE: Estado global compartido
let currentUser = null;
let sessionData = {};

// Base de usuarios
const users = {
    "admin": { password: "admin123", role: "admin" },
    "user1": { password: "user123", role: "user" },
    "user2": { password: "user456", role: "user" }
};

// Vulnerable: Global state pollution
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const requestId = uuidv4();
    
    console.log(`[${requestId}] Login attempt: ${username}`);
    
    // 1. Validación básica
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // 2. VULNERABLE: Modificar estado global inmediatamente
    currentUser = {
        username,
        role: users[username].role,
        loginTime: new Date().toISOString(),
        requestId
    };
    
    console.log(`[${requestId}] Set global currentUser:`, currentUser);
    
    // 3. VULNERABLE: Procesamiento asíncrono con delay variable
    const delay = Math.random() * 100; // 0-100ms
    setTimeout(() => {
        // Simula procesamiento de permisos adicionales
        if (username === 'admin') {
            currentUser.extraPermissions = ['manage_users', 'view_logs'];
        }
        
        console.log(`[${requestId}] Async processing completed. Current user:`, currentUser);
        
        res.json({
            success: true,
            user: currentUser,
            sessionId: requestId
        });
    }, delay);
});

// Vulnerable: Lee del estado global
app.get('/api/profile', (req, res) => {
    const requestId = uuidv4();
    console.log(`[${requestId}] Profile request. Current global user:`, currentUser);
    
    if (!currentUser) {
        return res.status(401).json({ error: "Not logged in" });
    }
    
    // VULNERABLE: Devuelve directamente el estado global
    res.json({
        profile: currentUser,
        accessTime: new Date().toISOString(),
        requestId
    });
});

// Vulnerable: Admin endpoint que lee estado global
app.get('/api/admin/users', (req, res) => {
    const requestId = uuidv4();
    console.log(`[${requestId}] Admin users request. Current user:`, currentUser);
    
    // VULNERABLE: Autorización basada en estado global
    if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
    }
    
    res.json({
        users: Object.keys(users),
        accessedBy: currentUser,
        requestId
    });
});

// Reset para pruebas
app.post('/api/reset', (req, res) => {
    currentUser = null;
    sessionData = {};
    res.json({ message: "Global state reset" });
});

// Info de la API
app.get('/api/info', (req, res) => {
    res.json({
        name: "VulnAuth API", 
        description: "Vulnerable authentication API demonstrating global state pollution",
        vulnerabilities: ["Global state pollution", "Race conditions in auth"],
        port: PORT,
        currentGlobalState: currentUser
    });
});

app.listen(PORT, () => {
    console.log(`🔐 VulnAuth API running on http://localhost:${PORT}`);
    console.log(`🔓 VULNERABLE: Global state pollution in authentication`);
});