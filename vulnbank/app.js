const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getBalance, updateBalance, getAllAccounts, resetAccounts } = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Vulnerable: Race condition en transferencias
app.post('/api/transfer', async (req, res) => {
    const { fromAccount, toAccount, amount } = req.body;
    
    console.log(`[${new Date().toISOString()}] Transfer request: ${fromAccount} -> ${toAccount}, amount: ${amount}`);
    
    try {
        // 1. Time-of-Check: Verificar saldo
        const fromBalance = await getBalance(fromAccount);
        const toBalance = await getBalance(toAccount);
        
        console.log(`Balance check - From: ${fromBalance}, To: ${toBalance}`);
        
        if (fromBalance >= amount) {
            // 2. VULNERABLE: Ventana temporal sin bloqueo
            console.log(`[VULNERABLE WINDOW] Sleeping for 100ms...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 3. Time-of-Use: Ejecutar transferencia (sin atomicidad)
            await updateBalance(fromAccount, fromBalance - amount);
            await updateBalance(toAccount, toBalance + amount);
            
            console.log(`Transfer completed successfully`);
            res.json({ 
                success: true, 
                message: "Transfer completed",
                fromBalance: fromBalance - amount,
                toBalance: toBalance + amount,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({ 
                error: "Insufficient funds",
                balance: fromBalance,
                requested: amount 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para consultar saldos
app.get('/api/balance/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const balance = await getBalance(accountId);
    res.json({ accountId, balance });
});

// Endpoint para ver todas las cuentas (debug)
app.get('/api/accounts', (req, res) => {
    res.json(getAllAccounts());
});

// Reset para pruebas
app.post('/api/reset', (req, res) => {
    resetAccounts();
    res.json({ message: "Accounts reset to initial state" });
});

// Info de la API
app.get('/api/info', (req, res) => {
    res.json({
        name: "VulnBank API",
        description: "Vulnerable banking API demonstrating race conditions",
        vulnerabilities: ["Race Condition in transfers", "Non-atomic operations"],
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`🏦 VulnBank API running on http://localhost:${PORT}`);
    console.log(`🔓 VULNERABLE: Race conditions in /api/transfer`);
});