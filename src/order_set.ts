import RedisHelper, { RedisHelperReplyParser } from "./redis";

/**
 * redis有序集合类
 */
export class OrderSet {
  helper: RedisHelper;

  constructor(helper: RedisHelper) {
    this.helper = helper;
  }

  /**
   * 为指定有序集合添加多个成员
   * @param key
   * @param arr,先分数后值
   * @returns {Promise}
   */
  async zadd(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.zadd(key, ...arr);
    this.helper.logger.debug(`set  key: ${key}, arr: ${JSON.stringify(arr)}`);
    return new RedisHelperReplyParser(re);
  }

  /**
   * 返回有序集中指定区间内的成员，通过索引，分数从高到底
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrevrange(
    key: string,
    start: string,
    end: string,
    withscores: boolean = true
  ): Promise<RedisHelperReplyParser> {
    let re;
    if (withscores) {
      re = await this.helper.redisClient.zrange(key, start, end, "WITHSCORES");
    } else {
      re = await this.helper.redisClient.zrange(key, start, end);
    }
    this.helper.logger.debug(
      `zrevrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 通过索引区间返回有序集合成指定区间内的成员
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrange(
    key: string,
    start: string,
    end: string,
    withscores: boolean = true
  ): Promise<RedisHelperReplyParser> {
    let re;
    if (withscores) {
      re = await this.helper.redisClient.zrange(key, start, end, "WITHSCORES");
    } else {
      re = await this.helper.redisClient.zrange(key, start, end);
    }
    this.helper.logger.debug(
      `zrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 通过分数返回有序集合指定区间内的成员
   * @param key
   * @param maxScore
   * @param minScore
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrevrangebyscore(
    key: string,
    maxScore: string,
    minScore: string,
    withscores: boolean = true
  ): Promise<RedisHelperReplyParser> {
    let re;
    if (withscores) {
      re = await this.helper.redisClient.zrange(
        key,
        maxScore,
        minScore,
        "WITHSCORES"
      );
    } else {
      re = await this.helper.redisClient.zrange(key, maxScore, minScore);
    }
    this.helper.logger.debug(
      `zrevrangebyscore  key: ${key}, maxScore: ${maxScore}, minScore: ${minScore}, withscores: ${withscores}`
    );
    return new RedisHelperReplyParser(re);
  }

  /**
   * 获取有序集合中某个成员的分数
   * @param key
   * @param val
   */
  async zscore(key: string, val: string): Promise<RedisHelperReplyParser> {
    const re = await this.helper.redisClient.zscore(key, val);
    this.helper.logger.debug(`zscore  key: ${key}, val: ${val}`);
    return new RedisHelperReplyParser(re);
  }
}
