import RedisHelper, { RedisHelperReplyParser } from "./redis";

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
   * @returns {Promise<any>}
   */
  async incr(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.incr(key);
    this.helper.logger.debug(`incr  key: ${key}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 将 key 所储存的值加上给定的增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  async incrBy(key: string, incr: number): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.incrby(key, incr);
    this.helper.logger.debug(`incrBy  key: ${key}, incr: ${incr}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 将 key 所储存的值加上给定的浮点增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  async incrByFloat(
    key: string,
    incr: number
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.incrbyfloat(key, incr);
    this.helper.logger.debug(`incrByFloat  key: ${key}, incr: ${incr}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 设置值
   * @param key
   * @param value
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async set(key: string, value: string): Promise<boolean> {
    const re = await this.helper.redisClient.set(key, value);
    this.helper.logger.debug(`set  key: ${key}, value: ${value}`);
    return re === `OK`;
  }

  /**
   * 只有在 key 不存在时设置 key 的值
   * @param key
   * @returns {Promise<any>}
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
   * @returns {Promise<any>}
   */
  async get(key: string): Promise<RedisHelperReplyParser> {
    const reply = await this.helper.redisClient.get(key);
    this.helper.logger.debug(
      `get  key: ${key}, result: ${JSON.stringify(reply)}`
    );
    return new RedisHelperReplyParser(reply);
  }
}