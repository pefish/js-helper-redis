import 'node-assist'
import assert from 'assert'
import RedisClusterHelper from './redis'

describe('RedisClusterHelper', () => {

  let helper

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

  // it('String get', async () => {
  //   try {
  //     logger.error('1')
  //     const result = await helper.string.get('test')
  //     logger.error(2)
  //     logger.error(result)
  //   } catch (err) {
  //     logger.error('haha', err)
  //     assert.throws(() => {}, err)
  //   }
  // })
})
