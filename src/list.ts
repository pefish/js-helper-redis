import { RedisHelper } from "./redis";

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
   * @returns {Promise<number>} 操作后，列表的长度
   */
  async lpush(key: string, arr: string[]): Promise<number> {
    this.helper.logger.debug(`lpush, key: ${key}, arr: ${JSON.stringify(arr)}`);
    return await this.helper.redisClient.lpush(key, ...arr);
  }

  /**
   * 移除并获取列表头一个元素
   * @param key
   * @returns {Promise<string>}
   */
  async lpop(key: string): Promise<string> {
    this.helper.logger.debug(`lpop, key: ${key}`);
    return await this.helper.redisClient.lpop(key);
  }

  /**
   * 返回列表的长度
   * @param key
   * @returns {Promise<number>} 如果列表 key 不存在，返回 0
   */
  async length(key: string): Promise<number> {
    this.helper.logger.debug(`llen, key: ${key}`);
    return await this.helper.redisClient.llen(key);
  }

  /**
   * 通过索引获取列表中的元素
   * @param key
   * @param index
   * @returns {Promise<string>} 如果指定索引值不在列表的区间范围内，返回 null
   */
  async get(key: string, index: number): Promise<string> {
    this.helper.logger.debug(`lindex, key: ${key}, index: ${index}`);
    return await this.helper.redisClient.lindex(key, index);
  }

  /**
   * 获取列表中的最后一个元素
   * @param key
   * @returns {Promise<string>} 如果一个元素都没有，返回 null
   */
  async last(key: string): Promise<string> {
    this.helper.logger.debug(`lindex, key: ${key}, index: -1`);
    return await this.helper.redisClient.lindex(key, -1);
  }

  /**
   * 为指定列表添加多个成员，是依次添加到尾部
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise<number>} 操作后，列表的长度
   */
  async rpush(key: string, arr: string[]): Promise<number> {
    this.helper.logger.debug(`rpush, key: ${key}, arr: ${JSON.stringify(arr)}`);
    return await this.helper.redisClient.rpush(key, ...arr);
  }

  /**
   * 移除并获取列表最后一个元素
   * @param key
   * @returns {Promise<string>}
   */
  async rpop(key: string): Promise<string> {
    this.helper.logger.debug(`rpop, key: ${key}`);
    return await this.helper.redisClient.rpop(key);
  }

  /**
   * 获取列表指定范围内的元素，[0,-1] 可获取所有元素
   * @param key
   * @param start
   * @param end
   * @returns {Promise<string[]>}
   */
  async lrange(key: string, start: number, end: number): Promise<string[]> {
    this.helper.logger.debug(
      `lrange  key: ${key}, start: ${start}, end: ${end}`
    );
    return await this.helper.redisClient.lrange(key, start, end);
  }
}
