import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { createApp } from "../server.js";

const BIO = (await readFile(new URL("../bio.txt", import.meta.url), "utf8")).trim();
const FAKE_KEY = "fake-test-key-123";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function withApp(env, fn) {
  const app = createApp({ env });
  const base = await listen(app);
  try {
    await fn(base);
  } finally {
    app.close();
  }
}

function ask(base, question) {
  return fetch(`${base}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

test("home page shows the bio and marks the assistant as not ready without a key", async () => {
  await withApp({}, async (base) => {
    const res = await fetch(base);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes(BIO));
    assert.ok(html.includes('data-ready="false"'));
    assert.ok(html.includes("https://github.com/emelinafry"));
  });
});

test("ask returns 503 with the not-set-up message when the key is missing", async () => {
  await withApp({}, async (base) => {
    const res = await ask(base, "Where does she live?");
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: "The assistant is not set up yet." });
  });
});

test("with a key, ask calls OpenAI from the server and the key never reaches the page", async () => {
  const seen = [];
  const mock = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    seen.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks)) });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "The bio doesn't say." } }] }));
  });
  const mockBase = await listen(mock);

  try {
    await withApp({ OPENAI_API_KEY: FAKE_KEY, OPENAI_BASE_URL: mockBase }, async (base) => {
      const html = await (await fetch(base)).text();
      assert.ok(html.includes('data-ready="true"'));
      assert.ok(!html.includes(FAKE_KEY));

      const res = await ask(base, "What is her favourite food?");
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data, { answer: "The bio doesn't say." });
      assert.ok(!JSON.stringify(data).includes(FAKE_KEY));

      assert.equal(seen.length, 1);
      assert.equal(seen[0].url, "/chat/completions");
      assert.equal(seen[0].auth, `Bearer ${FAKE_KEY}`);
      const [system, user] = seen[0].body.messages;
      assert.equal(system.role, "system");
      assert.ok(system.content.includes(BIO));
      assert.deepEqual(user, { role: "user", content: "What is her favourite food?" });
    });
  } finally {
    mock.close();
  }
});

test("ask rejects an empty question", async () => {
  await withApp({ OPENAI_API_KEY: FAKE_KEY, OPENAI_BASE_URL: "http://127.0.0.1:9" }, async (base) => {
    const res = await ask(base, "   ");
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Type a question first." });
  });
});
