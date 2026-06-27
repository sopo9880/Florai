import net from "node:net";
import tls from "node:tls";
import { debugLog } from "@/lib/floraiDebug";

const defaultKeyPrefix = process.env.FLORAI_REDIS_KEY_PREFIX || "florai";
const redisUrl = process.env.REDIS_URL || process.env.FLORAI_REDIS_URL || "";

export const redisKeys = {
  queue: `${defaultKeyPrefix}:job:queue`,
  job: (jobId: string) => `${defaultKeyPrefix}:job:${jobId}`,
  result: (jobId: string) => `${defaultKeyPrefix}:result:${jobId}`,
};

export function isRedisEnabled() {
  return Boolean(redisUrl);
}

export async function enqueueAnalysisJob(jobId: string, job: unknown) {
  const client = createRedisClient();
  const ttlSeconds = getJobTtlSeconds();
  const jobValue = JSON.stringify(job);

  debugLog("REDIS_SET_JOB", {
    jobId,
    key: redisKeys.job(jobId),
    ttlSeconds,
    valueBytes: Buffer.byteLength(jobValue),
  });

  await client.set(redisKeys.job(jobId), jobValue, ttlSeconds);

  debugLog("REDIS_PUSH_QUEUE", {
    jobId,
    queueKey: redisKeys.queue,
  });

  await client.rpush(redisKeys.queue, jobId);
}

export async function getAnalysisJob(jobId: string) {
  const client = createRedisClient();
  const key = redisKeys.job(jobId);
  const raw = await client.get(key);

  debugLog("REDIS_GET_JOB", {
    jobId,
    key,
    found: Boolean(raw),
    valueLength: raw?.length ?? 0,
  });

  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export async function getAnalysisResult(jobId: string) {
  const client = createRedisClient();
  const key = redisKeys.result(jobId);
  const raw = await client.get(key);

  debugLog("REDIS_GET_RESULT", {
    jobId,
    key,
    found: Boolean(raw),
    valueLength: raw?.length ?? 0,
  });

  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function getJobTtlSeconds() {
  const ttl = Number(process.env.FLORAI_JOB_TTL_SECONDS || 60 * 30);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 60 * 30;
}

type RedisValue = string | null | number;

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  rpush(key: string, value: string): Promise<void>;
};

function createRedisClient(): RedisClient {
  if (!redisUrl) {
    throw new Error("REDIS_URL 또는 FLORAI_REDIS_URL 환경변수가 필요합니다.");
  }

  return new MinimalRedisClient(redisUrl);
}

class MinimalRedisClient implements RedisClient {
  private readonly url: URL;

  constructor(url: string) {
    this.url = new URL(url);
  }

  async get(key: string) {
    const response = await this.command("GET", key);
    if (response === null) return null;
    return String(response);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.command("SET", key, value, "EX", String(ttlSeconds));
      return;
    }

    await this.command("SET", key, value);
  }

  async rpush(key: string, value: string) {
    await this.command("RPUSH", key, value);
  }

  private async command(...args: string[]): Promise<RedisValue> {
    const socket = await this.connect();

    try {
      const password = decodeURIComponent(this.url.password || "");
      const username = decodeURIComponent(this.url.username || "");

      if (password) {
        if (username && username !== "default") {
          await this.send(socket, ["AUTH", username, password]);
        } else {
          await this.send(socket, ["AUTH", password]);
        }
      }

      const dbIndex = this.url.pathname.replace("/", "");
      if (dbIndex) {
        await this.send(socket, ["SELECT", dbIndex]);
      }

      return await this.send(socket, args);
    } finally {
      socket.end();
      socket.destroy();
    }
  }

  private connect(): Promise<net.Socket | tls.TLSSocket> {
    const host = this.url.hostname;
    const port = Number(this.url.port || (this.url.protocol === "rediss:" ? 6380 : 6379));
    const secure = this.url.protocol === "rediss:";

    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = secure
        ? tls.connect({ host, port, servername: host })
        : net.connect({ host, port });

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(socket);
      };

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(new Error("Redis 연결 시간이 초과되었습니다."));
      }, 8_000);

      if (secure) {
        socket.once("secureConnect", finish);
      } else {
        socket.once("connect", finish);
      }

      socket.once("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private send(socket: net.Socket | tls.TLSSocket, args: string[]): Promise<RedisValue> {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      const payload = encodeCommand(args);

      const cleanup = () => {
        socket.off("data", onData);
        socket.off("error", onError);
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const onData = (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        const parsed = parseRedisResponse(buffer);

        if (!parsed.complete) return;

        cleanup();
        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }

        resolve(parsed.value);
      };

      socket.on("data", onData);
      socket.once("error", onError);
      socket.write(payload);
    });
  }
}

function encodeCommand(args: string[]) {
  const parts = [`*${args.length}\r\n`];
  for (const arg of args) {
    const bytes = Buffer.byteLength(arg);
    parts.push(`$${bytes}\r\n${arg}\r\n`);
  }
  return parts.join("");
}

type ParsedResponse = {
  complete: boolean;
  value: RedisValue;
  error?: string;
};

function parseRedisResponse(buffer: Buffer): ParsedResponse {
  if (buffer.length === 0) return { complete: false, value: null };

  const prefix = String.fromCharCode(buffer[0]);
  const crlfIndex = buffer.indexOf("\r\n");
  if (crlfIndex === -1) return { complete: false, value: null };

  const firstLine = buffer.subarray(1, crlfIndex).toString("utf8");

  if (prefix === "+") return { complete: true, value: firstLine };
  if (prefix === "-") return { complete: true, value: null, error: firstLine };
  if (prefix === ":") return { complete: true, value: Number(firstLine) };

  if (prefix === "$") {
    const length = Number(firstLine);
    if (length === -1) return { complete: true, value: null };

    const start = crlfIndex + 2;
    const end = start + length;
    const expected = end + 2;
    if (buffer.length < expected) return { complete: false, value: null };

    return {
      complete: true,
      value: buffer.subarray(start, end).toString("utf8"),
    };
  }

  return { complete: true, value: null, error: `지원하지 않는 Redis 응답입니다: ${prefix}` };
}
