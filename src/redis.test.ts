import { Logger } from "@pefish/js-logger";
import assert from "assert";
import { RedisHelper } from "./redis";

describe("RedisClusterHelper", () => {
  let helper: RedisHelper;

  before(async () => {
    helper = new RedisHelper(new Logger(), {
      host: "0.0.0.0",
      password: "password",
    });
  });

  it("init", async () => {
    try {
      await helper.init();
    } catch (err) {
      global[`logger`].error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("String set", async () => {
    try {
      const result = await helper.string.set("test", `test`);
      console.error(result);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("String setnx", async () => {
    try {
      console.error("1");
      const result = await helper.string.setnx("test1", `1`, 3);
      console.error(2);
      console.error(result);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("String get", async () => {
    try {
      const result = await helper.string.get("test");
      console.error(result);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("getLock", async () => {
    try {
      const result = await helper.getLock(`lock`, `111`, 3);
      console.error(result);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("releaseLock", async () => {
    try {
      await helper.releaseLock(`lock`, `111`);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });

  it("List rpush", async () => {
    try {
      await helper.list.rpush("test_list", ["3", "4"]);
      const result = await helper.list.lrange("test_list", 0, -1);
      console.error(result);
    } catch (err) {
      console.error("haha", err);
      assert.throws(() => {}, err);
    }
  });
});
