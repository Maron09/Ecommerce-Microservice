

async function invalidateProductCache(req, input) {
    const cachedkey = `product:${input}`;
    await req.redisClient.del(cachedkey);

    const keys = await req.redisClient.keys("product:*");
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

export default invalidateProductCache;