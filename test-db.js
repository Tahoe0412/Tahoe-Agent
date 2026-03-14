/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL environment variable.");
}

const client = new Client({
  connectionString,
});

async function testConnection() {
  console.log("正在尝试剥离 Prisma，使用原生 pg 驱动连接数据库...");
  try {
    await client.connect();
    console.log("✅ 奇迹出现了！原生连接完全成功。这说明是 Prisma 的内部环境或版本问题。");
    const res = await client.query("SELECT NOW()");
    console.log("数据库当前时间:", res.rows[0].now);
  } catch (err) {
    console.error("❌ 原生连接同样失败。报错信息如下：");
    console.error(err.message);
  } finally {
    await client.end();
  }
}

testConnection();
