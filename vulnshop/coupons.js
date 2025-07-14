// Simulación de base de datos de cupones y órdenes
let coupons = {
    "SAVE20": { 
        discount: 20, 
        maxUses: 1, 
        usedBy: [], 
        active: true,
        description: "20% discount - single use"
    },
    "WELCOME10": { 
        discount: 10, 
        maxUses: 3, 
        usedBy: [], 
        active: true,
        description: "10% discount - 3 uses max"
    },
    "FLASH50": { 
        discount: 50, 
        maxUses: 1, 
        usedBy: [], 
        active: true,
        description: "50% flash discount - single use"
    }
};

let orders = {
    "order1": { total: 100, discountsApplied: [], finalPrice: 100 },
    "order2": { total: 250, discountsApplied: [], finalPrice: 250 },
    "order3": { total: 75, discountsApplied: [], finalPrice: 75 }
};

function getCoupon(couponCode) {
    return new Promise((resolve) => {
        // Simula latencia de BD
        setTimeout(() => {
            resolve(coupons[couponCode] || null);
        }, 15);
    });
}

function validateCoupon(couponCode, userId) {
    return new Promise(async (resolve) => {
        const coupon = await getCoupon(couponCode);
        
        if (!coupon || !coupon.active) {
            resolve(false);
        } else if (coupon.usedBy.length >= coupon.maxUses) {
            resolve(false);
        } else if (coupon.usedBy.includes(userId)) {
            resolve(false);
        } else {
            resolve(true);
        }
    });
}

function applyCouponDiscount(orderId, couponCode, userId) {
    return new Promise(async (resolve) => {
        const coupon = await getCoupon(couponCode);
        const order = orders[orderId];
        
        if (!coupon || !order) {
            resolve(null);
        }
        
        // VULNERABLE: No re-validación aquí
        const discountAmount = (order.finalPrice * coupon.discount) / 100;
        
        // Marcar como usado
        coupon.usedBy.push(userId);
        
        // Aplicar descuento
        order.discountsApplied.push({
            coupon: couponCode,
            discount: coupon.discount,
            amount: discountAmount,
            userId: userId,
            timestamp: new Date().toISOString(),
            appliedToPrice: order.finalPrice // Registro del precio al que se aplicó
        });
        
        // ✅ CORREGIDO: Acumular descuentos correctamente
        order.finalPrice = Math.max(0, order.finalPrice - discountAmount);
        
        setTimeout(() => {
            resolve({
                discountAmount,
                newPrice: order.finalPrice,
                couponDiscount: coupon.discount
            });
        }, 30);
    });
}

function getOrder(orderId) {
    return orders[orderId] || null;
}

function getAllCoupons() {
    return coupons;
}

function getAllOrders() {
    return orders;
}

function resetData() {
    // Reset cupones
    Object.keys(coupons).forEach(code => {
        coupons[code].usedBy = [];
    });
    
    // Reset órdenes
    Object.keys(orders).forEach(orderId => {
        const order = orders[orderId];
        order.discountsApplied = [];
        order.finalPrice = order.total;
    });
}

module.exports = { 
    validateCoupon, 
    applyCouponDiscount, 
    getOrder, 
    getAllCoupons, 
    getAllOrders, 
    resetData 
};