import RedisHelper, { RedisHelperReplyParser } from "./redis";

/**
 * redis哈希表类
 */
export class Hash {
  helper: RedisHelper;

  constructor(helper: RedisHelper) {
    this.helper = helper;
  }

  /**
   * 为指定哈希表设置多个哈希值(键值对)
   * @param key 哈希键
   * @param arr 键值对
   * @returns {Promise}
   */
  async hmset(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hmset(key, ...arr);
    this.helper.logger.debug(`hmset  key: ${key}, arr: ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 只有在字段 field 不存在时，设置哈希表字段的值
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  async hsetnx(
    key: string,
    field: string,
    value: string
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hsetnx(key, field, value);
    this.helper.logger.debug(
      `hsetnx  key: ${key}, field: ${field}, value: ${value}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 将哈希表 key 中的字段 field 的值设为 value
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  async hset(
    key: string,
    field: string,
    value: string
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hset(key, field, value);
    this.helper.logger.debug(
      `hset  key: ${key}, field: ${field}, value: ${value}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 为哈希表 key 中的域 field 的值加上增量 increment
   * @param key
   * @param field
   * @param incre
   * @returns {Promise<any>}
   */
  async hincrby(
    key: string,
    field: string,
    incre: number = 1
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hincrby(key, field, incre);
    this.helper.logger.debug(
      `hincrby  key: ${key}, field: ${field}, incre: ${incre}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 获取指定哈希表的field的值
   * @param key
   * @param field
   * @returns {Promise}
   */
  async hget(key: string, field: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hget(key, field);
    this.helper.logger.debug(
      `hget  key: ${key}, field: ${field}, result: ${JSON.stringify(re)}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 返回指定哈希表中所有键值对
   * @param key
   * @returns {Promise}
   */
  async hgetall(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hgetall(key);
    this.helper.logger.debug(
      `hgetall  key: ${key}, result: ${JSON.stringify(re)}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 删除一个哈希表字段
   * @param key
   * @param field
   * @returns {Promise<any>}
   */
  async hdel(key: string, field: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.hdel(key, field);
    this.helper.logger.debug(`hdel  key: ${key}, field: ${field}`);
    return new RedisHelperReplyParser(re);
  }
}
