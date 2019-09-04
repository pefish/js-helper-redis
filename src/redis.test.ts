import '@pefish/js-node-assist'
import assert from 'assert'
import RedisClusterHelper from './redis'

describe('RedisClusterHelper', () => {

  let helper: RedisClusterHelper

  before(async () => {
    helper = new RedisClusterHelper({
      host: '0.0.0.0',
    })
  })

  it('init', async () => {
    try {
      await helper.init()
    } catch (err) {
      global[`logger`].error('haha', err)
      assert.throws(() => {}, err)
    }
  })

  it('String set', async () => {
    try {
      global.logger.error('1')
      const result = await helper.string.set('test', `test`)
      global.logger.error(2)
      global.logger.error(result)
    } catch (err) {
      global.logger.error('haha', err)
      assert.throws(() => {}, err)
    }
  })

  it('String setnx', async () => {
    try {
      global.logger.error('1')
      const result = await helper.string.setnx('test1', `1`, 3)
      global.logger.error(2)
      global.logger.error(result)
    } catch (err) {
      global.logger.error('haha', err)
      assert.throws(() => {}, err)
    }
  })

  it('String get', async () => {
    try {
      global.logger.error('1')
      const result = await helper.string.get('test')
      global.logger.error(2)
      global.logger.error(result)
    } catch (err) {
      global.logger.error('haha', err)
      assert.throws(() => {}, err)
    }
  })

  it('getLock', async () => {
    try {
      const result = await helper.getLock(`lock`, `111`, 3)
      global.logger.error(result)
    } catch (err) {
      global.logger.error('haha', err)
      assert.throws(() => {}, err)
    }
  })

  it('releaseLock', async () => {
    try {
      await helper.releaseLock(`lock`, `111`)
    } catch (err) {
      global.logger.error('haha', err)
      assert.throws(() => {}, err)
    }
  })
})
