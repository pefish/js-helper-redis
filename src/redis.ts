import '@pefish/js-node-assist'
import Redis from 'ioredis'

type RedisConfig = {
  host: string;
  port?: number;
  db?: number;
}

export default class RedisHelper {
  config: RedisConfig;
  redisClient: Redis;
  set: RedisHelperSet;
  list: RedisHelperList;
  string: RedisHelperString;
  orderSet: RedisHelperOrderSet;
  hash: RedisHelperHash;

  constructor(config: RedisConfig) {
    this.config = config

    this.redisClient = new Redis(Object.assign({
      lazyConnect: true,
    }, config))

    this.redisClient.defineCommand("releaseLock", {
      numberOfKeys: 1,
      lua: "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"
    });
    /**
     * 集合
     * @type {RedisHelperSet}
     */
    this.set = new RedisHelperSet(this, this.redisClient)
    /**
     * 列表
     * @type {RedisHelperList}
     */
    this.list = new RedisHelperList(this, this.redisClient)
    /**
     * 字符串
     * @type {RedisHelperString}
     */
    this.string = new RedisHelperString(this, this.redisClient)
    /**
     * 有序集合
     * @type {RedisHelperOrderSet}
     */
    this.orderSet = new RedisHelperOrderSet(this, this.redisClient)
    /**
     * 哈希表
     * @type {RedisHelperHash}
     */
    this.hash = new RedisHelperHash(this, this.redisClient)
  }

  get Empty(): RedisHelperReplyParser {
    return new RedisHelperReplyParser(null)
  }

  async init(): Promise<void> {
    try {
      global.logger.info(`connecting redis: ${this.config.host} ...`)
      await this.redisClient.connect()
      global.logger.info(`redis: ${this.config.host} connect succeed!`)
    } catch (err) {
      await this.close(); // 禁止重连
      global.logger.error(`redis: ${this.config.host} connect failed!`, err)
      throw err
    }
  }

  /**
   * 给key设定过期时间
   * @param key {string} key
   * @param seconds {number} 过期秒数
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async expire(key: string, seconds: number): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }

    const reply = await this.redisClient.expire(key, seconds)
    global.logger.debug(`expire  key: ${key}, seconds: ${seconds}`)
    return new RedisHelperReplyParser(reply)
  }

  async getLock(key: string, value: string, seconds: number): Promise<boolean> {
    global.logger.debug(`getLock  key: ${key}, value: ${value} seconds: ${seconds}`)
    const result = await this.string.setnx(key, value, seconds)
    if (result == true) {
      const timer = setInterval(async () => {
        const val = await this.string.get(key)
        if (val.get() === value) {
          this.expire(key, seconds)
        } else {
          clearInterval(timer)
        }
      }, seconds * 1000 / 2)
    }
    return result
  }

  async releaseLock(key: string, value: string) {
    global.logger.debug(`releaseLock  key: ${key}, value: ${value}`)
    const result = await this.redisClient.releaseLock(key, value)
    if (result === 0) {
      return
    }
    global.logger.debug(`releaseLock success. key: ${key}, value: ${value}`)
  }

  /**
   * 删除key
   * @param key {string} key
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async del(key: string): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    const reply = await this.redisClient.del(key)
    global.logger.debug(`del  key: ${key}`)
    return new RedisHelperReplyParser(reply)
  }

  /**
   * 安全退出redis
   * @returns {*}
   */
  async quitSafely(): Promise<any> {
    return await this.redisClient.quit()
  }

  async close(): Promise<any> {
    return await this.quitSafely()
  }

  /**
   * 强制退出redis
   * @returns {*}
   */
  async quitForcibly(): Promise<any> {
    // 正在运行的命令回调会执行，但会有error
    return await this.redisClient.end(true)
  }


  /**
   * 将client转为subscribe模式(此时只有subscribe相关命令以及quit命令可以有效执行)
   * @param channel
   */
  async subscribe(channel: string): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    await this.redisClient.subscribe(channel)
    return new RedisHelperReplyParser(true)
  }

  /**
   * subscribe事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onSubscribe(callback: (channel: string, count: number) => void): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    await this.redisClient.on('subscribe', (channel, count) => {
      callback(channel, count)
    })
    return new RedisHelperReplyParser(true)
  }

  /**
   * unsubscribe事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onUnsubscribe(callback: (channel: string, count: number) => void): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    await this.redisClient.on('unsubscribe', (channel, count) => {
      callback(channel, count)
    })
    return new RedisHelperReplyParser(true)
  }

  /**
   * message事件
   * @param callback
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async onMessage(callback: (channel: string, message: any) => void): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    await this.redisClient.on('message', (channel, message) => {
      callback(channel, message)
    })
    return new RedisHelperReplyParser(true)
  }

  /**
   * 开启事务
   * @returns {*|any}
   */
  async multi(): Promise<any> {
    return await this.redisClient.multi()
  }

  /**
   * commit事务
   * @param multi {object} multi实例
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async exec(multi: any): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    const res = await multi.exec()
    global.logger.debug(`exec  multi: ${multi}`)
    return new RedisHelperReplyParser(res)
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
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    const replies = await this.redisClient.multi(exeArr).exec()
    global.logger.debug(`multiWithTransaction  exeArr: ${JSON.stringify(exeArr)}`)
    return new RedisHelperReplyParser(replies)
  }

  /**
   * 非事务性执行
   * @param exeArr {array} 执行命令数组
   * @returns {Promise}
   */
  async multiWithoutTransaction(exeArr: [][]): Promise<RedisHelperReplyParser> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    const replies = await this.redisClient.batch(exeArr).exec()
    global.logger.debug(`multiWithoutTransaction  exeArr: ${JSON.stringify(exeArr)}`)
    return new RedisHelperReplyParser(replies)
  }

  /**
   * 复制出一个新的客户端
   * @returns {Promise}
   */
  async duplicate(): Promise<any> {
    if (this.isConnected()) {
      throw new Error('redis未连接')
    }
    return await this.redisClient.duplicate()
  }

  /**
   * 是否已连接
   * @returns {boolean}
   */
  isConnected(): boolean {
    return this.redisClient.connected
  }
}

/**
 * redis集合类
 */
class RedisHelperSet {
  helper: RedisHelper;
  redisClient: Redis;

  constructor(helper: RedisHelper, redisClient: Redis) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定集合添加多个成员, 数组前面的元素在smembers中会在后面显示
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  async sadd(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.sadd(key, ...arr)
    global.logger.debug(`sadd: ${key}, ${JSON.stringify(arr)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 返回集合中的所有成员
   * @param key {string} key
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async smembers(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.smembers(key)
    global.logger.debug(`smembers: ${key}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 判断 member 元素是否是集合 key 的成员
   * @param key {string} key
   * @param member {string} 成员
   * @returns {Promise<any>}
   */
  async sismember(key: string, member: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.sismember(key, member)
    global.logger.debug(`sismember  key: ${key}, member: ${member}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 随机取且移除
   * @param key {string} key
   * @returns {Promise}
   */
  async spop(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.spop(key)
    global.logger.debug(`spop  key: ${key}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 移除集合中一个或多个成员
   * @param key {string} key
   * @param arr {array} 要移除的所有成员
   * @returns {Promise<any>}
   */
  async srem(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.srem(key, ...arr)
    global.logger.debug(`srem  key: ${key}, arr: ${JSON.stringify(arr)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 获取成员数
   * @param key {string} key
   * @returns {Promise<any>}
   */
  async scard(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.scard(key)
    global.logger.debug(`scard  key: ${key}`)
    return new RedisHelperReplyParser(re)
  }
}

/**
 * redis列表类
 */
class RedisHelperList {
  helper: RedisHelper;
  redisClient: Redis;

  constructor(helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定列表添加多个成员
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  async lpush(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.lpush(key, ...arr)
    global.logger.debug(`lpush  key: ${key}, arr: ${JSON.stringify(arr)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 移除并获取列表最后一个元素
   * @param key
   * @returns {Promise<any>}
   */
  async rpop(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.rpop(key)
    global.logger.debug(`rpop  key: ${key}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 获取列表指定范围内的元素
   * @param key
   * @param start
   * @param end
   * @returns {Promise<any>}
   */
  async lrange(key: string, start: number, end: number): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.lrange(key, start, end)
    global.logger.debug(`lrange  key: ${key}, start: ${start}, end: ${end}`)
    return new RedisHelperReplyParser(re)
  }
}

/**
 * redis哈希表类
 */
class RedisHelperHash {
  helper: RedisHelper;
  redisClient: Redis;

  constructor(helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定哈希表设置多个哈希值(键值对)
   * @param key 哈希键
   * @param arr 键值对
   * @returns {Promise}
   */
  async hmset(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hmset(key, ...arr)
    global.logger.debug(`hmset  key: ${key}, arr: ${JSON.stringify(arr)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 只有在字段 field 不存在时，设置哈希表字段的值
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  async hsetnx(key: string, field: string, value: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hsetnx(key, field, value)
    global.logger.debug(`hsetnx  key: ${key}, field: ${field}, value: ${value}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 将哈希表 key 中的字段 field 的值设为 value
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  async hset(key: string, field: string, value: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hset(key, field, value)
    global.logger.debug(`hset  key: ${key}, field: ${field}, value: ${value}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 为哈希表 key 中的域 field 的值加上增量 increment
   * @param key
   * @param field
   * @param incre
   * @returns {Promise<any>}
   */
  async hincrby(key: string, field: string, incre: number = 1): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hincrby(key, field, incre)
    global.logger.debug(`hincrby  key: ${key}, field: ${field}, incre: ${incre}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 获取指定哈希表的field的值
   * @param key
   * @param field
   * @returns {Promise}
   */
  async hget(key: string, field: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hget(key, field)
    global.logger.debug(`hget  key: ${key}, field: ${field}, result: ${JSON.stringify(re)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 返回指定哈希表中所有键值对
   * @param key
   * @returns {Promise}
   */
  async hgetall(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hgetall(key)
    global.logger.debug(`hgetall  key: ${key}, result: ${JSON.stringify(re)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 删除一个哈希表字段
   * @param key
   * @param field
   * @returns {Promise<any>}
   */
  async hdel(key: string, field: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.hdel(key, field)
    global.logger.debug(`hdel  key: ${key}, field: ${field}`)
    return new RedisHelperReplyParser(re)
  }

}

/**
 * redis字符串类
 */
class RedisHelperString {
  helper: RedisHelper;
  redisClient: Redis;

  constructor(helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 将 key 中储存的数字值增一
   * @param key
   * @returns {Promise<any>}
   */
  async incr(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.incr(key)
    global.logger.debug(`incr  key: ${key}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 将 key 所储存的值加上给定的增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  async incrBy(key: string, incr: number): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.incrby(key, incr)
    global.logger.debug(`incrBy  key: ${key}, incr: ${incr}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 将 key 所储存的值加上给定的浮点增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  async incrByFloat(key: string, incr: number): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.incrbyfloat(key, incr)
    global.logger.debug(`incrByFloat  key: ${key}, incr: ${incr}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 设置值
   * @param key
   * @param value
   * @returns {Promise<RedisHelperReplyParser>}
   */
  async set(key: string, value: string): Promise<boolean> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.set(key, value)
    global.logger.debug(`set  key: ${key}, value: ${value}`)
    return re === `OK`
  }

  /**
   * 只有在 key 不存在时设置 key 的值
   * @param key
   * @returns {Promise<any>}
   */
  async setnx(key: string, value: string = `1`, expireSeconds: number = 0): Promise<boolean> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    let re
    global.logger.debug(`setnx  key: ${key}, expireSeconds: ${expireSeconds}`)
    if (expireSeconds == 0) {
      re = await this.redisClient.setnx(key, value)
    } else {
      re = await this.redisClient.set(key, value, `EX`, expireSeconds, `nx`)
    }
    return re === `OK`
  }

  /**
   * 获取值
   * @param key
   * @returns {Promise<any>}
   */
  async get(key: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }

    const reply = await this.redisClient.get(key)
    global.logger.debug(`get  key: ${key}, result: ${JSON.stringify(reply)}`)
    return new RedisHelperReplyParser(reply)
  }

}

/**
 * redis有序集合类
 */
class RedisHelperOrderSet {
  helper: RedisHelper;
  redisClient: Redis;

  constructor(helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定有序集合添加多个成员
   * @param key
   * @param arr,先分数后值
   * @returns {Promise}
   */
  async zadd(key: string, arr: string[]): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.zadd(key, ...arr)
    global.logger.debug(`set  key: ${key}, arr: ${JSON.stringify(arr)}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 返回有序集中指定区间内的成员，通过索引，分数从高到底
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrevrange(key: string, start: string, end: string, withscores: boolean = true): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const arr = [start, end]
    withscores && arr.push('withscores')
    const re = await this.redisClient.zrevrange(key, ...arr)
    global.logger.debug(`zrevrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 通过索引区间返回有序集合成指定区间内的成员
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrange(key: string, start: string, end: string, withscores: boolean = true): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const arr = [start, end]
    withscores && arr.push('withscores')
    const re = await this.redisClient.zrange(key, ...arr)
    global.logger.debug(`zrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 通过分数返回有序集合指定区间内的成员
   * @param key
   * @param maxScore
   * @param minScore
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  async zrevrangebyscore(key: string, maxScore: string, minScore: string, withscores: boolean = true): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const arr = [maxScore, minScore]
    withscores && arr.push('withscores')
    const re = await this.redisClient.zrevrangebyscore(key, ...arr)
    global.logger.debug(`zrevrangebyscore  key: ${key}, maxScore: ${maxScore}, minScore: ${minScore}, withscores: ${withscores}`)
    return new RedisHelperReplyParser(re)
  }

  /**
   * 获取有序集合中某个成员的分数
   * @param key
   * @param val
   */
  async zscore(key: string, val: string): Promise<RedisHelperReplyParser> {
    if (this.helper.isConnected()) {
      throw new Error('redis未连接')
    }
    const re = await this.redisClient.zscore(key, val)
    global.logger.debug(`zscore  key: ${key}, val: ${val}`)
    return new RedisHelperReplyParser(re)
  }
}

/**
 * 返回结果包装类
 */
class RedisHelperReplyParser {
  source: any;

  constructor(source) {
    this.source = source
  }

  /**
   * 不转换直接取出来
   * @returns {*}
   */
  get(): any {
    return this.source
  }

  /**
   * ['test', 7, 'test1', 8] => {test: 7, test1: 8}
   * @returns {{}}
   */
  toObj(): object {
    const result = {}
    for (let i = 0; i < this.source.length; i = i + 2) {
      result[this.source[i]] = this.source[i + 1]
    }
    return result
  }

  /**
   * 转为bool值
   * @returns {boolean}
   */
  toBool(): boolean {
    return this.source === 1
  }

  /**
   * 转换为带分数的数组
   * @param withscores
   * @returns {Array}
   */
  toScoreValue(withscores = true): any[] {
    if (!this.source || !(this.source.length > 0)) {
      return []
    }

    const result = []
    for (let i = 0; i < this.source.length; i = i + 2) {
      if (withscores) {
        const temp = {}
        temp['value'] = JSON.parse(this.source[i])
        temp['score'] = parseInt(this.source[i + 1])
        result.push(temp)
      } else {
        result.push(JSON.parse(this.source[i]))
      }
    }
    return result
  }
}
