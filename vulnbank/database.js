// Simulación simple de base de datos en memoria
let accounts = {
    "user1": { balance: 1000, transactions: [] },
    "user2": { balance: 500, transactions: [] },
    "user3": { balance: 750, transactions: [] }
};

function getBalance(accountId) {
    return new Promise((resolve) => {
        // Simula latencia de BD
        setTimeout(() => {
            resolve(accounts[accountId]?.balance || 0);
        }, 10);
    });
}

function updateBalance(accountId, newBalance) {
    return new Promise((resolve) => {
        // Simula latencia de escritura
        setTimeout(() => {
            if (accounts[accountId]) {
                accounts[accountId].balance = newBalance;
                accounts[accountId].transactions.push({
                    timestamp: new Date(),
                    balance: newBalance
                });
            }
            resolve(true);
        }, 20);
    });
}

function getAllAccounts() {
    return accounts;
}

function resetAccounts() {
    accounts = {
        "user1": { balance: 1000, transactions: [] },
        "user2": { balance: 500, transactions: [] },
        "user3": { balance: 750, transactions: [] }
    };
}

module.exports = { getBalance, updateBalance, getAllAccounts, resetAccounts };