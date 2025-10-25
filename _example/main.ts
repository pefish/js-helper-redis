import Starter, { StartArgs } from "@pefish/js-starter";
import { RedisHelper } from "../src/redis";

async function main(args: StartArgs) {
  //   const redisUrl: string = process.env["REDIS_URL"] as string;
  //   const [host, port] = redisUrl.split(":");
  //   const redisClient = new Redis({
  //     host: host,
  //     port: parseInt(port),
  //     password: process.env["REDIS_PASSWORD"] as string,
  //     maxRetriesPerRequest: null,
  //     enableReadyCheck: true,
  //   });
  //   //   await redisClient.connect();
  //   console.log("redis connected");
  //   const a = await redisClient.get("test");
  //   console.log(a);
  //   return;

  const redisInstance = new RedisHelper(args.logger, {
    url: process.env["REDIS_URL"] as string,
    password: process.env["REDIS_PASSWORD"] as string,
  });
  console.log("redis connected");
  const a = await redisInstance.string.get("test");
  console.log(a);
}

async function onExited(err: Error) {
  // await globalThis.driver.quit();
}

Starter.start(main, onExited);
