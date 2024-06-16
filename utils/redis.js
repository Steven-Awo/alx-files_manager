import { createClient } from 'redis';

import { promisify } from 'util';


class RedisClient {
  constructor() {

    this.client = createClient();

    this.client.on('error', (error) => {

      console.log(`Redis client not connected to server: ${error}`);

    });
  }

  isAlive() {
    if (this.client.connected) {

      return true;

    }
    return false;
  }

  async get(key) {

    const getting_redis = promisify(this.client.get).bind(this.client);

    const valuee = await getting_redis(key);

    return valuee;

  }

  async set(key, value, time) {

    const setting_redis = promisify(this.client.set).bind(this.client);

    await setting_redis(key, value);

    await this.client.expire(key, time);

  }

  async del(key) {

    const deleting_redis = promisify(this.client.del).bind(this.client);

    await deleting_redis(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
