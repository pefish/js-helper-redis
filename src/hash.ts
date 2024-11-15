import { RedisHelper } from "./redis";

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
   */
  async hmset(key: string, arr: string[]) {
    this.helper.logger.debug(`hmset, key: ${key}, arr: ${JSON.stringify(arr)}`);
    const re = await this.helper.redisClient.hmset(key, ...arr);
    if (re !== "OK") {
      throw new Error(`hmset failed. key: ${key}, arr: ${JSON.stringify(arr)}`);
    }
  }

  /**
   * 只有在字段 field 不存在时，设置哈希表字段的值
   * @param key
   * @param field
   * @param value
   * @returns {Promise<boolean>} 如果给定字段已经存在且没有操作被执行，返回 false
   */
  async hsetnx(key: string, field: string, value: string): Promise<boolean> {
    this.helper.logger.debug(
      `hsetnx, key: ${key}, field: ${field}, value: ${value}`
    );
    const re = await this.helper.redisClient.hsetnx(key, field, value);
    return re === 1;
  }

  /**
   * 将哈希表 key 中的字段 field 的值设为 value，如果字段已经存在于哈希表中，旧值将被覆盖
   * @param key
   * @param field
   * @param value
   */
  async hset(key: string, field: string, value: string) {
    this.helper.logger.debug(
      `hset, key: ${key}, field: ${field}, value: ${value}`
    );
    await this.helper.redisClient.hset(key, field, value);
  }

  /**
   * 为哈希表 key 中的域 field 的值加上增量 increment，如果值不是 number 类型，会报错
   * @param key
   * @param field
   * @param incre
   * @returns {Promise<number>} 执行 HINCRBY 命令之后，哈希表中字段的值
   */
  async hincrby(
    key: string,
    field: string,
    incre: number = 1
  ): Promise<number> {
    this.helper.logger.debug(
      `hincrby, key: ${key}, field: ${field}, incre: ${incre}`
    );
    return await this.helper.redisClient.hincrby(key, field, incre);
  }

  /**
   * 获取指定哈希表的field的值
   * @param key
   * @param field
   * @returns {Promise<string | null>}
   */
  async hget(key: string, field: string): Promise<string | null> {
    this.helper.logger.debug(`hget, key: ${key}, field: ${field}}`);
    return await this.helper.redisClient.hget(key, field);
  }

  /**
   * 返回指定哈希表中所有键值对
   * @param key
   * @returns {Promise<{ [x: string]: string }>}
   */
  async hgetall(key: string): Promise<{ [x: string]: string }> {
    this.helper.logger.debug(`hgetall, key: ${key}`);
    return await this.helper.redisClient.hgetall(key);
  }

  /**
   * 删除一个哈希表字段
   * @param key
   * @param field
   */
  async hdel(key: string, field: string) {
    this.helper.logger.debug(`hdel, key: ${key}, field: ${field}`);
    const re = await this.helper.redisClient.hdel(key, field);
    if (re !== 1) {
      throw new Error(`hdel failed. key: ${key}, field: ${field}`);
    }
  }
}
