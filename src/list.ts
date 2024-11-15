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
   */
  async lpush(key: string, arr: string[]) {
    this.helper.logger.debug(`lpush, key: ${key}, arr: ${JSON.stringify(arr)}`);
    await this.helper.redisClient.lpush(key, ...arr);
  }

  /**
   * 为指定列表添加多个成员，是依次添加到尾部
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   */
  async rpush(key: string, arr: string[]) {
    this.helper.logger.debug(`rpush, key: ${key}, arr: ${JSON.stringify(arr)}`);
    await this.helper.redisClient.rpush(key, ...arr);
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
