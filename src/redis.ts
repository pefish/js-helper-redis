import { ILogger } from "@pefish/js-logger";
import Redis from "ioredis";
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

export default class RedisHelper {
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

  get Empty(): RedisHelperReplyParser {
    return new RedisHelperReplyParser(null);
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
   * 给key设定过期时间
   * @param key {string} key
   * @param seconds {number} 过期秒数
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async expire(key: string, seconds: number): Promise<RedisHelperReplyParser> {
    const reply = await this.redisClient.expire(key, seconds);
    this.logger.debug(`expire  key: ${key}, seconds: ${seconds}`);
    return new RedisHelperReplyParser(reply);
  }

  async getLock(key: string, value: string, seconds: number): Promise<boolean> {
    this.logger.debug(
      `getLock  key: ${key}, value: ${value} seconds: ${seconds}`
    );
    const result = await this.string.setnx(key, value, seconds);
    if (result == true) {
      const timer = setInterval(async () => {
        const val = await this.string.get(key);
        if (val.get() === value) {
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
   * 删除key
   * @param key {string} key
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async del(key: string): Promise<RedisHelperReplyParser> {
    const reply = await this.redisClient.del(key);
    this.logger.debug(`del  key: ${key}`);
    return new RedisHelperReplyParser(reply);
  }

  /**
   * 安全退出redis
   * @returns {*}
   */
  async quitSafely(): Promise<any> {
    return await this.redisClient.quit();
  }

  async close(): Promise<any> {
    return await this.quitSafely();
  }

  /**
   * 将client转为subscribe模式(此时只有subscribe相关命令以及quit命令可以有效执行)
   * @param channel
   */
  async subscribe(channel: string): Promise<RedisHelperReplyParser> {
    await this.redisClient.subscribe(channel);
    return new RedisHelperReplyParser(true);
  }

  /**
   * subscribe事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onSubscribe(
    callback: (channel: string, count: number) => void
  ): Promise<RedisHelperReplyParser> {
    await this.redisClient.on("subscribe", (channel, count) => {
      callback(channel, count);
    });
    return new RedisHelperReplyParser(true);
  }

  /**
   * unsubscribe事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onUnsubscribe(
    callback: (channel: string, count: number) => void
  ): Promise<RedisHelperReplyParser> {
    await this.redisClient.on("unsubscribe", (channel, count) => {
      callback(channel, count);
    });
    return new RedisHelperReplyParser(true);
  }

  /**
   * message事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onMessage(
    callback: (channel: string, message: any) => void
  ): Promise<RedisHelperReplyParser> {
    await this.redisClient.on("message", (channel, message) => {
      callback(channel, message);
    });
    return new RedisHelperReplyParser(true);
  }

  /**
   * 开启事务
   * @returns {*|any}
   */
  async multi(): Promise<any> {
    return await this.redisClient.multi();
  }

  /**
   * commit事务
   * @param multi {object} multi实例
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async exec(multi: any): Promise<RedisHelperReplyParser> {
    const res = await multi.exec();
    this.logger.debug(`exec  multi: ${multi}`);
    return new RedisHelperReplyParser(res);
  }

  /**
   * 事务性执行
   * @param exeArr {array} 执行命令数组
   * [
   *  ["mget", "multifoo", "multibar", redis.print],
   *  ["incr", "multifoo"],
   *  ["incr", "multibar"]
   * ]
   * @returns {Promise}
   */
  async multiWithTransaction(exeArr: [][]): Promise<RedisHelperReplyParser> {
    const replies = await this.redisClient.multi(exeArr).exec();
    this.logger.debug(
      `multiWithTransaction  exeArr: ${JSON.stringify(exeArr)}`
    );
    return new RedisHelperReplyParser(replies);
  }

  /**
   * 复制出一个新的客户端
   * @returns {Promise}
   */
  async duplicate(): Promise<any> {
    return await this.redisClient.duplicate();
  }
}

/**
 * 返回结果包装类
 */
export class RedisHelperReplyParser {
  source: any;

  constructor(source) {
    this.source = source;
  }

  /**
   * 不转换直接取出来
   * @returns {*}
   */
  get(): any {
    return this.source;
  }

  /**
   * ['test', 7, 'test1', 8] => {test: 7, test1: 8}
   * @returns {{}}
   */
  toObj(): object {
    const result = {};
    for (let i = 0; i < this.source.length; i = i + 2) {
      result[this.source[i]] = this.source[i + 1];
    }
    return result;
  }

  /**
   * 转为bool值
   * @returns {boolean}
   */
  toBool(): boolean {
    return this.source === 1;
  }

  /**
   * 转换为带分数的数组
   * @param withscores
   * @returns {Array}
   */
  toScoreValue(withscores = true): any[] {
    if (!this.source || !(this.source.length > 0)) {
      return [];
    }

    const result = [];
    for (let i = 0; i < this.source.length; i = i + 2) {
      if (withscores) {
        const temp = {};
        temp["value"] = JSON.parse(this.source[i]);
        temp["score"] = parseInt(this.source[i + 1]);
        result.push(temp);
      } else {
        result.push(JSON.parse(this.source[i]));
      }
    }
    return result;
  }
}
