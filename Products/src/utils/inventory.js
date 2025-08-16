function generateInventoryCode(productId) {
    const random = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${productId}-${random}-${timestamp}`;
}

export default generateInventoryCode;