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
  await redisInstance.subscribe(
    args.abortSignal,
    ["test_channel"],
    (channel: string, message: string) => {
      switch (channel) {
        case "test_channel":
          args.logger.info(`received message from test_channel: ${message}`);
          break;
        default:
          args.logger.warn(
            `received message from unknown channel: ${channel}, message: ${message}`
          );
      }
    }
  );
}

async function onExited(err: Error) {
  // await globalThis.driver.quit();
}

Starter.start(main, onExited);
