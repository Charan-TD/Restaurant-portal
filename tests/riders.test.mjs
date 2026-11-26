import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/features/riders/models/rider.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { riderProblems, docProblem } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("only name and phone are required", () => {
  assert.deepEqual(riderProblems({ name: "Ravi Kumar", phone: "9876543210" }), {});
  assert.ok(riderProblems({ name: "R", phone: "1234567890" }).name);
  assert.ok(riderProblems({ name: "Ravi", phone: "1234567890" }).phone);
});

test("optional fields are checked only when filled", () => {
  const base = { name: "Ravi", phone: "9876543210" };
  assert.ok(riderProblems({ ...base, email: "nope" }).email);
  assert.ok(riderProblems({ ...base, aadhaarNumber: "123" }).aadhaarNumber);
  assert.ok(riderProblems({ ...base, panNumber: "abcde1234f" }).panNumber);
  assert.deepEqual(riderProblems({ ...base, email: "a@b.co", aadhaarNumber: "123456789012", panNumber: "ABCDE1234F" }), {});
});

test("documents are JPG, PNG or PDF up to 5 MB", () => {
  assert.equal(docProblem({ type: "application/pdf", size: 1000 }), "");
  assert.ok(docProblem({ type: "image/webp", size: 1000 }));
  assert.ok(docProblem({ type: "image/png", size: 6 * 1024 * 1024 }));
});
