const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { 
    validateCoupon, 
    applyCouponDiscount, 
    getOrder, 
    getAllCoupons, 
    getAllOrders, 
    resetData 
} = require('./coupons');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(bodyParser.json());

// Vulnerable: TOCTOU en aplicación de cupones
app.post('/api/apply-coupon', async (req, res) => {
    const { userId, couponCode, orderId } = req.body;
    const requestId = uuidv4();
    
    console.log(`[${requestId}] Coupon application: User ${userId}, Coupon ${couponCode}, Order ${orderId}`);
    
    try {
        // 1. Time-of-Check: Validar cupón
        console.log(`[${requestId}] TIME-OF-CHECK: Validating coupon...`);
        const isValid = await validateCoupon(couponCode, userId);
        
        if (!isValid) {
            console.log(`[${requestId}] Coupon validation failed`);
            return res.status(400).json({ 
                error: "Invalid coupon or already used",
                requestId 
            });
        }
        
        console.log(`[${requestId}] Coupon validation successful`);
        
        // 2. VULNERABLE: Ventana temporal TOCTOU (200ms)
        console.log(`[${requestId}] [VULNERABLE WINDOW] Processing delay 200ms...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 3. Time-of-Use: Aplicar descuento (SIN re-validación)
        console.log(`[${requestId}] TIME-OF-USE: Applying discount...`);
        const result = await applyCouponDiscount(orderId, couponCode, userId);
        
        if (!result) {
            return res.status(400).json({ 
                error: "Failed to apply discount",
                requestId 
            });
        }
        
        console.log(`[${requestId}] Discount applied successfully:`, result);
        
        res.json({
            success: true,
            message: "Coupon applied successfully",
            discount: result,
            requestId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`[${requestId}] Error:`, error);
        res.status(500).json({ 
            error: error.message,
            requestId 
        });
    }
});

// Endpoint para ver órdenes
app.get('/api/order/:orderId', (req, res) => {
    const { orderId } = req.params;
    const order = getOrder(orderId);
    
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({ orderId, ...order });
});

// Endpoint para ver cupones (debug)
app.get('/api/coupons', (req, res) => {
    res.json(getAllCoupons());
});

// Endpoint para ver todas las órdenes (debug)
app.get('/api/orders', (req, res) => {
    res.json(getAllOrders());
});

// Reset para pruebas
app.post('/api/reset', (req, res) => {
    resetData();
    res.json({ message: "Coupons and orders reset to initial state" });
});

// Info de la API
app.get('/api/info', (req, res) => {
    res.json({
        name: "VulnShop API",
        description: "Vulnerable e-commerce API demonstrating TOCTOU vulnerabilities",
        vulnerabilities: ["TOCTOU in coupon validation", "Race conditions in discount application"],
        port: PORT,
        availableCoupons: Object.keys(getAllCoupons()),
        availableOrders: Object.keys(getAllOrders())
    });
});

app.listen(PORT, () => {
    console.log(`🛒 VulnShop API running on http://localhost:${PORT}`);
    console.log(`🔓 VULNERABLE: TOCTOU in /api/apply-coupon`);
    console.log(`📋 Available coupons: SAVE20, WELCOME10, FLASH50`);
    console.log(`📦 Available orders: order1, order2, order3`);
});