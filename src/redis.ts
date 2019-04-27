import Redis from 'ioredis'
import ErrorHelper from 'p-js-error'

export default class RedisHelper {
  redisClient: Redis;
  set: RedisHelperSet;
  list: RedisHelperList;
  string: RedisHelperString;
  orderSet: RedisHelperOrderSet;
  hash: RedisHelperHash;

  constructor (config) {
    this.redisClient = new Redis(Object.assign({
      lazyConnect: true,
    }, config))
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

  get Empty (): RedisHelperReplyParser {
    return new RedisHelperReplyParser(null)
  }

  async init (): Promise<void> {
    try {
      await this.redisClient.connect()
    } catch (err) {
      await this.close() // 禁止重连
      throw err
    }
  }

  /**
   * 给key设定过期时间
   * @param key {string} key
   * @param seconds {number} 过期秒数
   * @returns {Promise<any>}
   */
  expire (key: string, seconds: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }

      this.redisClient.expire(key, seconds, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
          return
        }
        global[`debug`] && global[`logger`].info(`expire  key: ${key}, seconds: ${seconds}`)
        resolve(reply)
      })
    })
  }

  /**
   * 删除key
   * @param key {string} key
   * @returns {Promise<any>}
   */
  del (key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.del(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`del  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 安全退出redis
   * @returns {*}
   */
  quitSafely (): any {
    return this.redisClient.quit()
  }

  close (): any {
    return this.quitSafely()
  }

  /**
   * 强制退出redis
   * @returns {*}
   */
  quitForcibly (): any {
    // 正在运行的命令回调会执行，但会有error
    return this.redisClient.end(true)
  }


  /**
   * 将client转为subscribe模式(此时只有subscribe相关命令以及quit命令可以有效执行)
   * @param channel
   */
  subscribe(channel: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.subscribe(channel)
      resolve(true)
    })
  }

  /**
   * subscribe事件
   * @param callback
   * @returns {Promise<any>}
   */
  onSubscribe(callback: (channel: string, count: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.on('subscribe', (channel, count) => {
        callback(channel, count)
      })
      resolve(true)
    })
  }

  /**
   * unsubscribe事件
   * @param callback
   * @returns {Promise<any>}
   */
  onUnsubscribe(callback: (channel: string, count: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.on('unsubscribe', (channel, count) => {
        callback(channel, count)
      })
      resolve(true)
    })
  }

  /**
   * message事件
   * @param callback
   * @returns {Promise<any>}
   */
  onMessage(callback: (channel: string, message: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.on('message', (channel, message) => {
        callback(channel, message)
      })
      resolve(true)
    })
  }

  /**
   * 开启事务
   * @returns {*|any}
   */
  multi(): any {
    return this.redisClient.multi()
  }

  /**
   * commit事务
   * @param multi {object} multi实例
   * @returns {Promise<any>}
   */
  exec(multi: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      multi.exec((err, res) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`exec  multi: ${multi}`)
          resolve(res)
        }
      })
    })

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
  multiWithTransaction(exeArr: [][]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接');
        return
      }
      this.redisClient.multi(exeArr).exec((err, replies) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`multiWithTransaction  exeArr: ${JSON.stringify(exeArr)}`)
          resolve(replies)
        }
      })
    })
  }

  /**
   * 非事务性执行
   * @param exeArr {array} 执行命令数组
   * @returns {Promise}
   */
  multiWithoutTransaction(exeArr: [][]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.batch(exeArr).exec((err, replies) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`multiWithoutTransaction  exeArr: ${JSON.stringify(exeArr)}`)
          resolve(replies)
        }
      })
    })
  }

  /**
   * 监听模式下监听到数据后执行
   * @param callback {function}
   * @returns {Promise}
   */
  onMonitor(callback: (time: any, args: any, raw_reply: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.on('monitor', (time, args, raw_reply) => {
        global[`logger`].info(time + ': ' + args)
        callback(time, args, raw_reply)
      })
      resolve(true)
    })
  }

  /**
   * 进入监听模式，可以监听任何客户端的命令执行
   * @returns {Promise}
   */
  monitor(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.monitor((err, replies) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          resolve(replies)
        }
      })
    })
  }

  /**
   * 复制出一个新的客户端
   * @returns {Promise}
   */
  duplicate(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject('redis未连接')
        return
      }
      resolve(this.redisClient.duplicate())
    })
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

  constructor (helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定集合添加多个成员, 数组前面的元素在smembers中会在后面显示
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  sadd (key: string, arr: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.sadd(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`sadd  key: ${key}, arr: ${JSON.stringify(arr)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 返回集合中的所有成员
   * @param key {string} key
   * @returns {Promise<any>}
   */
  smembers (key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.smembers(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`smembers  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 判断 member 元素是否是集合 key 的成员
   * @param key {string} key
   * @param member {string} 成员
   * @returns {Promise<any>}
   */
  sismember (key: string, member: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.sismember(key, member, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`sismember  key: ${key}, member: ${member}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 随机取且移除
   * @param key {string} key
   * @returns {Promise}
   */
  spop (key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.spop(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`spop  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 移除集合中一个或多个成员
   * @param key {string} key
   * @param arr {array} 要移除的所有成员
   * @returns {Promise<any>}
   */
  srem (key: string, arr: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.srem(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`srem  key: ${key}, arr: ${JSON.stringify(arr)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 获取成员数
   * @param key {string} key
   * @returns {Promise<any>}
   */
  scard (key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.scard(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`scard  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }
}

/**
 * redis列表类
 */
class RedisHelperList {
  helper: RedisHelper;
  redisClient: Redis;

  constructor (helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定列表添加多个成员
   * @param key {string} key
   * @param arr {array} 要添加的所有成员
   * @returns {Promise}
   */
  lpush(key: string, arr: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.lpush(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`lpush  key: ${key}, arr: ${JSON.stringify(arr)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 移除并获取列表最后一个元素
   * @param key
   * @returns {Promise<any>}
   */
  rpop(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.rpop(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`rpop  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 获取列表指定范围内的元素
   * @param key
   * @param start
   * @param end
   * @returns {Promise<any>}
   */
  lrange(key: string, start: number, end: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.lrange(key, start, end, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`lrange  key: ${key}, start: ${start}, end: ${end}`)
          resolve(reply)
        }
      })
    })
  }
}

/**
 * redis哈希表类
 */
class RedisHelperHash {
  helper: RedisHelper;
  redisClient: Redis;

  constructor (helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定哈希表设置多个哈希值(键值对)
   * @param key 哈希键
   * @param arr 键值对
   * @returns {Promise}
   */
  hmset(key: string, arr: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hmset(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hmset  key: ${key}, arr: ${JSON.stringify(arr)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 只有在字段 field 不存在时，设置哈希表字段的值
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  hsetnx(key: string, field: string, value: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hsetnx(key, field, value, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hsetnx  key: ${key}, field: ${field}, value: ${value}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 将哈希表 key 中的字段 field 的值设为 value
   * @param key
   * @param field
   * @param value
   * @returns {Promise<any>}
   */
  hset(key: string, field: string, value: string): Promise<any> {
    // logger.error(arguments)
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hset(key, field, value, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hset  key: ${key}, field: ${field}, value: ${value}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 为哈希表 key 中的域 field 的值加上增量 increment
   * @param key
   * @param field
   * @param incre
   * @returns {Promise<any>}
   */
  hincrby(key: string, field: string, incre: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hincrby(key, field, incre, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hincrby  key: ${key}, field: ${field}, incre: ${incre}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 获取指定哈希表的field的值
   * @param key
   * @param field
   * @returns {Promise}
   */
  hget(key: string, field: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hget(key, field, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hget  key: ${key}, field: ${field}, result: ${JSON.stringify(reply)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 返回指定哈希表中所有键值对
   * @param key
   * @returns {Promise}
   */
  hgetall(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hgetall(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hgetall  key: ${key}, result: ${JSON.stringify(reply)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 删除一个哈希表字段
   * @param key
   * @param field
   * @returns {Promise<any>}
   */
  hdel(key: string, field: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.hdel(key, field, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`hdel  key: ${key}, field: ${field}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

}

/**
 * redis字符串类
 */
class RedisHelperString {
  helper: RedisHelper;
  redisClient: Redis;

  constructor (helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 将 key 中储存的数字值增一
   * @param key
   * @returns {Promise<any>}
   */
  incr(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.incr(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`incr  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 将 key 所储存的值加上给定的增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  incrBy(key: string, incr: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.incrby(key, incr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`incrBy  key: ${key}, incr: ${incr}`)
          resolve(reply)
        }
      })
    })
  }

  /**
   * 将 key 所储存的值加上给定的浮点增量值 increment
   * @param key
   * @param incr
   * @returns {Promise<any>}
   */
  incrByFloat(key: string, incr: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.incrbyfloat(key, incr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`incrByFloat  key: ${key}, incr: ${incr}`)
          resolve(reply)
        }
      })
    })
  }

  /**
   * 设置值
   * @param key
   * @param value
   * @returns {Promise<any>}
   */
  set(key: string, value: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.set(key, value, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`set  key: ${key}, value: ${value}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 同时设置值和过期时间
   * @param key
   * @param seconds
   * @param value
   * @returns {Promise<any>}
   */
  setex(key: string, seconds: number, value: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.setex(key, seconds, value, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`setex  key: ${key}, seconds: ${seconds}, value: ${value}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 只有在 key 不存在时设置 key 的值
   * @param key
   * @returns {Promise<any>}
   */
  setnx(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.setnx(key, '1', (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`setnx  key: ${key}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 获取值
   * @param key
   * @returns {Promise<any>}
   */
  get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }

      this.redisClient.get(key, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`get  key: ${key}, result: ${JSON.stringify(reply)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

}

/**
 * redis有序集合类
 */
class RedisHelperOrderSet {
  helper: RedisHelper;
  redisClient: Redis;

  constructor (helper, redisClient) {
    this.helper = helper
    this.redisClient = redisClient
  }

  /**
   * 为指定有序集合添加多个成员
   * @param key
   * @param arr,先分数后值
   * @returns {Promise}
   */
  zadd(key: string, arr: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.zadd(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`set  key: ${key}, arr: ${JSON.stringify(arr)}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 返回有序集中指定区间内的成员，通过索引，分数从高到底
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  zrevrange(key: string, start: string, end: string, withscores: boolean = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      const arr = [start, end]
      withscores && arr.push('withscores')
      this.redisClient.zrevrange(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`zrevrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 通过索引区间返回有序集合成指定区间内的成员
   * @param key
   * @param start
   * @param end
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  zrange(key: string, start: string, end: string, withscores: boolean = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      const arr = [start, end]
      withscores && arr.push('withscores')
      this.redisClient.zrange(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`zrange  key: ${key}, start: ${start}, end: ${end}, withscores: ${withscores}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 通过分数返回有序集合指定区间内的成员
   * @param key
   * @param maxScore
   * @param minScore
   * @param withscores {boolean} 是否带分数
   * @returns {Promise<any>}
   */
  zrevrangebyscore(key: string, maxScore: string, minScore: string, withscores: boolean = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      const arr = [maxScore, minScore]
      withscores && arr.push('withscores')
      this.redisClient.zrevrangebyscore(key, ...arr, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`zrevrangebyscore  key: ${key}, maxScore: ${maxScore}, minScore: ${minScore}, withscores: ${withscores}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }

  /**
   * 获取有序集合中某个成员的分数
   * @param key
   * @param val
   */
  zscore(key: string, val: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.helper.isConnected()) {
        reject('redis未连接')
        return
      }
      this.redisClient.zscore(key, val, (err, reply) => {
        if (err) {
          reject(new ErrorHelper('失败', 0, null, err))
        } else {
          global[`debug`] && global[`logger`].info(`zscore  key: ${key}, val: ${val}`)
          resolve(new RedisHelperReplyParser(reply))
        }
      })
    })
  }
}

/**
 * 返回结果包装类
 */
class RedisHelperReplyParser {
  source: any;

  constructor (source) {
    this.source = source
  }

  /**
   * 不转换直接取出来
   * @returns {*}
   */
  get (): any {
    return this.source
  }

  /**
   * ['test', 7, 'test1', 8] => {test: 7, test1: 8}
   * @returns {{}}
   */
  toObj (): object {
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
  toBool (): boolean {
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
