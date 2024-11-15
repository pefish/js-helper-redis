import { RedisHelper } from "./redis";

/**
 * redis字符串类
 */
export class String {
  helper: RedisHelper;

  constructor(helper: RedisHelper) {
    this.helper = helper;
  }

  /**
   * 将 key 中储存的数字值增一
   * @param key
   */
  async incr(key: string) {
    this.helper.logger.debug(`incr, key: ${key}`);
    await this.helper.redisClient.incr(key);
  }

  /**
   * 将 key 所储存的值加上给定的增量值 increment
   * @param key
   * @param incr
   */
  async incrBy(key: string, incr: number) {
    this.helper.logger.debug(`incrBy, key: ${key}, incr: ${incr}`);
    await this.helper.redisClient.incrby(key, incr);
  }

  /**
   * 将 key 所储存的值加上给定的浮点增量值 increment
   * @param key
   * @param incr
   */
  async incrByFloat(key: string, incr: number) {
    this.helper.logger.debug(`incrByFloat, key: ${key}, incr: ${incr}`);
    await this.helper.redisClient.incrbyfloat(key, incr);
  }

  /**
   * 设置值
   * @param key
   * @param value
   */
  async set(key: string, value: string) {
    this.helper.logger.debug(`set  key: ${key}, value: ${value}`);
    const re = await this.helper.redisClient.set(key, value);
    if (re !== "OK") {
      throw new Error(`set failed. key: ${key}, value: ${value}`);
    }
  }

  /**
   * 只有在 key 不存在时设置 key 的值
   * @param key
   * @returns {Promise<boolean>}
   */
  async setnx(
    key: string,
    value: string = `1`,
    expireSeconds: number = 0
  ): Promise<boolean> {
    let re;
    this.helper.logger.debug(
      `setnx  key: ${key}, expireSeconds: ${expireSeconds}`
    );
    if (expireSeconds == 0) {
      re = await this.helper.redisClient.setnx(key, value);
    } else {
      re = await this.helper.redisClient.set(
        key,
        value,
        "EX",
        expireSeconds,
        "NX"
      );
    }
    return re === `OK`;
  }

  /**
   * 获取值
   * @param key
   * @returns {Promise<string | null>}
   */
  async get(key: string): Promise<string | null> {
    this.helper.logger.debug(`get, key: ${key}`);
    return await this.helper.redisClient.get(key);
  }
}
