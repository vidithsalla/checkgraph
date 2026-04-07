import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { after, test } from "node:test";
import { and, desc, eq } from "drizzle-orm";
import { closeDb, db } from "@/lib/db/client";
import { seedDatabase } from "@/lib/db/seed/run-seed";
import * as schema from "@/lib/db/schema";
import { loadCheckDetail } from "@/lib/server/checks/load-check-detail";

process.env.CHECKGRAPH_PROTOTYPE_ROLE = "manager";

let appProcess: ChildProcess | null = null;

after(async () => {
  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGTERM");
  }
  await closeDb();
});

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDepositFormFields(html: string) {
  const formMatch = html.match(
    /<section[^>]*>[\s\S]*?<h3[^>]*>\s*Apply Deposit To Check\s*<\/h3>[\s\S]*?<form[^>]*>([\s\S]*?)<\/form>/i,
  );
  assert.ok(formMatch, "Expected mounted Apply Deposit To Check form");

  const fields = new Map<string, string>();
  for (const match of formMatch[1]!.matchAll(
    /<input[^>]*type="hidden"[^>]*name="([^"]+)"(?:[^>]*value="([^"]*)")?[^>]*\/?>/g,
  )) {
    fields.set(decodeHtml(match[1]!), decodeHtml(match[2] ?? ""));
  }

  assert.ok(fields.has("$ACTION_REF_1"), "Expected Next server action ref field");
  assert.equal(fields.get("externalCheckRef"), "CHK-ORE-20260330-011");
  assert.equal(fields.get("bookingRef"), "BK-ORE-20260330-101");
  assert.equal(fields.get("depositRef"), "dep_ore_101");
  assert.equal(fields.get("amountCents"), "50000");

  return fields;
}

async function getFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a local test port."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function waitForServer(url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok) {
        return;
      }
      lastError = new Error(`Received status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Timed out waiting for the local Next app to start.");
}

async function latestEventFor(checkId: string) {
  const [row] = await db
    .select()
    .from(schema.checkEvents)
    .where(
      and(
        eq(schema.checkEvents.checkId, checkId),
        eq(schema.checkEvents.eventType, "deposit_applied_to_check"),
      ),
    )
    .orderBy(desc(schema.checkEvents.sequenceNo))
    .limit(1);
  return row ?? null;
}

async function latestAuditFor(checkId: string) {
  const [row] = await db
    .select()
    .from(schema.auditLogs)
    .where(
      and(
        eq(schema.auditLogs.entityId, checkId),
        eq(schema.auditLogs.actionType, "apply_deposit_to_check"),
      ),
    )
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(1);
  return row ?? null;
}

async function depositExceptionFor(checkId: string) {
  const [row] = await db
    .select()
    .from(schema.exceptions)
    .where(
      and(
        eq(schema.exceptions.checkId, checkId),
        eq(schema.exceptions.exceptionType, "deposit_captured_not_applied"),
      ),
    )
    .orderBy(desc(schema.exceptions.detectedAt))
    .limit(1);
  return row ?? null;
}

test("request-context smoke test: Apply Deposit To Check", async () => {
  await seedDatabase();

  const detailBefore = await loadCheckDetail("CHK-ORE-20260330-011");
  assert.ok(detailBefore, "Expected seeded hosted deposit scenario");
  assert.equal(detailBefore.derivedState?.depositState, "captured");
  assert.equal(detailBefore.derivedState?.depositAppliedAmountCents, 0);
  assert.deepEqual(
    detailBefore.activeExceptions.map((exception) => exception.exceptionType),
    ["deposit_captured_not_applied"],
  );

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const pageUrl = `${baseUrl}/checks/CHK-ORE-20260330-011`;

  appProcess = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        CHECKGRAPH_PROTOTYPE_ROLE: "manager",
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  let startupOutput = "";
  assert.ok(appProcess.stdout, "Expected child stdout stream");
  assert.ok(appProcess.stderr, "Expected child stderr stream");

  appProcess.stdout.on("data", (chunk) => {
    startupOutput += chunk.toString();
  });
  appProcess.stderr.on("data", (chunk) => {
    startupOutput += chunk.toString();
  });

  await waitForServer(pageUrl);

  const getResponse = await fetch(pageUrl);
  assert.equal(getResponse.status, 200);
  const initialHtml = await getResponse.text();
  assert.match(initialHtml, /Apply Deposit To Check/);
  assert.match(initialHtml, /deposit_captured_not_applied/);

  const fields = extractDepositFormFields(initialHtml);
  const reason = "Smoke test applied the captured booking deposit through the mounted Next form.";
  const formData = new FormData();
  for (const [name, value] of fields) {
    formData.append(name, value);
  }
  formData.append("reason", reason);

  const postResponse = await fetch(pageUrl, {
    method: "POST",
    body: formData,
  });
  assert.equal(postResponse.status, 200);
  const postHtml = await postResponse.text();

  assert.match(postHtml, /Severity:\s*<!-- -->none|Severity:.*none/);
  assert.match(postHtml, /No active exceptions\./);
  assert.match(postHtml, /manual_override_applied|deposit_applied_to_check/);
  assert.match(postHtml, /fully_applied/);
  assert.match(postHtml, new RegExp(reason.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const detailAfter = await loadCheckDetail("CHK-ORE-20260330-011");
  assert.ok(detailAfter, "Expected check detail after mounted form submission");
  assert.equal(detailAfter.derivedState?.depositState, "fully_applied");
  assert.equal(detailAfter.derivedState?.depositAppliedAmountCents, 50000);
  assert.equal(detailAfter.derivedState?.exceptionState, "none");
  assert.deepEqual(detailAfter.activeExceptions, []);

  const eventRow = await latestEventFor(detailBefore.check.id);
  const auditRow = await latestAuditFor(detailBefore.check.id);
  const exceptionRow = await depositExceptionFor(detailBefore.check.id);

  assert.ok(eventRow, "Expected deposit event row after mounted POST");
  assert.equal(eventRow.payloadJson.depositRef, "dep_ore_101");
  assert.equal(eventRow.payloadJson.amountCents, 50000);
  assert.equal(eventRow.payloadJson.reason, reason);

  assert.ok(auditRow, "Expected audit row after mounted POST");
  assert.equal(auditRow.note, reason);

  assert.ok(exceptionRow, "Expected persisted exception row");
  assert.equal(exceptionRow.status, "resolved");

  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGTERM");
    appProcess = null;
  }

  assert.ok(startupOutput.includes("Ready"), "Expected Next app to start successfully");
});
