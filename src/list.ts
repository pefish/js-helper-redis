import RedisHelper, { RedisHelperReplyParser } from "./redis";

/**
 * redis列表类
 */
export class List {
  helper: RedisHelper;

  constructor(helper: RedisHelper) {
    this.helper = helper;
  }

  /**
   * 为指定列表添加多个成员，是依次添加到头部
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  async lpush(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.lpush(key, ...arr);
    this.helper.logger.debug(`lpush  key: ${key}, arr: ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 为指定列表添加多个成员，是依次添加到尾部
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  async rpush(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.rpush(key, ...arr);
    this.helper.logger.debug(`rpush  key: ${key}, arr: ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 移除并获取列表最后一个元素
   * @param key
   * @returns {Promise<any>}
   */
  async rpop(key: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.rpop(key);
    this.helper.logger.debug(`rpop  key: ${key}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 获取列表指定范围内的元素，[0,-1] 可获取所有元素
   * @param key
   * @param start
   * @param end
   * @returns {Promise<any>}
   */
  async lrange(
    key: string,
    start: number,
    end: number
  ): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.lrange(key, start, end);
    this.helper.logger.debug(
      `lrange  key: ${key}, start: ${start}, end: ${end}`
    );
    return new RedisHelperReplyParser(re);
  }
}
