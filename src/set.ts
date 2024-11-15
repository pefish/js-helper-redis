import RedisHelper, { RedisHelperReplyParser } from "./redis";

/**
 * redis集合类
 */
export class Set {
  helper: RedisHelper;

  constructor(helper: RedisHelper) {
    this.helper = helper;
  }

  /**
   * 为指定集合添加多个成员, 数组前面的元素在smembers中会在后面显示
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  async sadd(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.sadd(key, ...arr);
    this.helper.logger.debug(`sadd: ${key}, ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 返回集合中的所有成员
   * @param key {string} key
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async smembers(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.smembers(key);
    this.helper.logger.debug(`smembers: ${key}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 判断 member 元素是否是集合 key 的成员
   * @param key {string} key
   * @param member {string} 成员
   * @returns {Promise<any>}
   */
  async sismember(
    key: string,
    member: string
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.sismember(key, member);
    this.helper.logger.debug(`sismember  key: ${key}, member: ${member}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 随机取且移除
   * @param key {string} key
   * @returns {Promise}
   */
  async spop(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.spop(key);
    this.helper.logger.debug(`spop  key: ${key}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 移除集合中一个或多个成员
   * @param key {string} key
   * @param arr {array} 要移除的所有成员
   * @returns {Promise<any>}
   */
  async srem(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.srem(key, ...arr);
    this.helper.logger.debug(`srem  key: ${key}, arr: ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 获取成员数
   * @param key {string} key
   * @returns {Promise<any>}
   */
  async scard(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.scard(key);
    this.helper.logger.debug(`scard  key: ${key}`);
    return new RedisHelperReplyParser(re);
  }
}
