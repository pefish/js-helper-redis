import { ILogger } from "@pefish/js-logger";
import Redis, { ChainableCommander } from "ioredis";
import { Hash } from "./hash";
import { List } from "./list";
import { OrderSet } from "./order_set";
import { Set } from "./set";
import { String } from "./string";

type RedisConfig = {
  host: string;
  port?: number;
  db?: number;
  password?: string;
};

export class RedisHelper {
  logger: ILogger;
  config: RedisConfig;
  redisClient: Redis;
  set: Set;
  list: List;
  string: String;
  orderSet: OrderSet;
  hash: Hash;

  constructor(logger: ILogger, config: RedisConfig) {
    this.logger = logger;
    this.config = config;

    this.redisClient = new Redis({
      lazyConnect: true,
      ...config,
    });

    this.redisClient.defineCommand("releaseLock", {
      numberOfKeys: 1,
      lua: "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    });

    this.set = new Set(this);
    this.list = new List(this);
    this.string = new String(this);
    this.orderSet = new OrderSet(this);
    this.hash = new Hash(this);
  }

  async init(): Promise<void> {
    try {
      this.logger.info(`connecting redis: ${this.config.host} ...`);
      await this.redisClient.connect();
      this.logger.info(`redis: ${this.config.host} connect succeed!`);
    } catch (err) {
      await this.close(); // 禁止重连
      this.logger.error(`redis: ${this.config.host} connect failed! ${err}`);
      throw err;
    }
  }

  /**
   * 给 key 设定过期时间
   * @param key {string} key
   * @param seconds {number} 过期秒数
   */
  async expire(key: string, seconds: number) {
    this.logger.debug(`expire  key: ${key}, seconds: ${seconds}`);
    await this.redisClient.expire(key, seconds);
  }

  async getLock(key: string, value: string, seconds: number): Promise<boolean> {
    this.logger.debug(
      `getLock  key: ${key}, value: ${value} seconds: ${seconds}`
    );
    const result = await this.string.setnx(key, value, seconds);
    if (result == true) {
      const timer = setInterval(async () => {
        const val = await this.string.get(key);
        if (val === value) {
          this.expire(key, seconds);
        } else {
          clearInterval(timer);
        }
      }, (seconds * 1000) / 2);
    }
    return result;
  }

  async releaseLock(key: string, value: string) {
    this.logger.debug(`releaseLock  key: ${key}, value: ${value}`);
    const result = await this.redisClient["releaseLock"](key, value);
    if (result === 0) {
      return;
    }
    this.logger.debug(`releaseLock success. key: ${key}, value: ${value}`);
  }

  /**
   * 删除 key
   * @param key {string} key
   */
  async del(key: string) {
    this.logger.debug(`del  key: ${key}`);
    await this.redisClient.del(key);
  }

  /**
   * 安全退出 redis
   */
  async close() {
    await this.redisClient.quit();
  }

  /**
   * 将 client 转为 subscribe 模式(此时只有 subscribe 相关命令以及 quit 命令可以有效执行)
   * @param channel
   */
  async subscribe(channel: string) {
    await this.redisClient.subscribe(channel);
  }

  /**
   * subscribe 事件
   * @param callback
   */
  onSubscribe(callback: (channel: string, count: number) => void) {
    this.redisClient.on("subscribe", (channel, count) => {
      callback(channel, count);
    });
  }

  /**
   * unsubscribe 事件
   * @param callback
   */
  onUnsubscribe(callback: (channel: string, count: number) => void) {
    this.redisClient.on("unsubscribe", (channel, count) => {
      callback(channel, count);
    });
  }

  /**
   * message 事件
   * @param callback
   */
  onMessage(callback: (channel: string, message: string) => void) {
    this.redisClient.on("message", callback);
  }

  /**
   * 开启事务
   * @returns {ChainableCommander}
   */
  multi(): ChainableCommander {
    return this.redisClient.multi();
  }

  /**
   * commit事务
   * @param multi {object} multi 实例
   */
  async exec(multi: ChainableCommander) {
    this.logger.debug(`exec multi: ${multi}`);
    await multi.exec();
  }

  /**
   * 事务性执行
   * @param exeArr {array} 执行命令数组
   * [
   *  ["mget", "multifoo", "multibar", redis.print],
   *  ["incr", "multifoo"],
   *  ["incr", "multibar"]
   * ]
   */
  async multiWithTransaction(exeArr: [][]) {
    this.logger.debug(`multiWithTransaction exeArr: ${JSON.stringify(exeArr)}`);
    await this.redisClient.multi(exeArr).exec();
  }

  /**
   * 复制出一个新的客户端
   * @returns {Promise}
   */
  duplicate(): Redis {
    return this.redisClient.duplicate();
  }
}
