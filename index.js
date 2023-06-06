const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const redis = require('redis');
const { promisify } = require('util');
const app = express();

// Async function to create the Redis client
const createRedisClient = () => {
    return new Promise((resolve, reject) => {
        const client = redis.createClient(redisOptions = {
            host: '127.0.0.1',
            port: 6379,
            password: process.env.APP_ENV === 'dev' ? undefined : process.env.REDIS_PASSWORD
        });
        client.pingAsync = promisify(client.ping).bind(client);
        const timer = setTimeout(() => {
            console.error("redis client connection timeout");
            resolve(null)
        }, 500);
        client.on("ready", () => {
            clearTimeout(timer);
            console.log('Connected to Redis server');
            resolve(client);
        });
        client.on('error', (err) => {
            console.error('Redis connection error:', err);
            reject(err);
        });
    });
};

// Health check endpoint
app.get('/redis-health-check', async (req, res) => {
    console.log('redis-health-check');
    const redisClient = await createRedisClient();
    if (!redisClient) {
        res.status(500).send('Redis Unavailable');
        return;
    }
    try {
        const result = await redisClient.pingAsync();
        res.status(200).send('Redis OK');
    } catch (error) {
        res.status(500).send('Redis Unavailable');
    }
    redisClient.quit();
});

// Handle other routes
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Start the server
const port = 3000;
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});