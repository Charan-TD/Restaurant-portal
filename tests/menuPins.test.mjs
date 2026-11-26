import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/features/menu/models/menuPins.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { orderPinned, moveBefore, pinChanges } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const item = (id, starred) => ({ id, starred });

test("only pinned dishes, in the saved order, new ones last", () => {
  const items = [item("a", true), item("b", false), item("c", true), item("d", true)];
  assert.deepEqual(orderPinned(items, ["d", "a"]).map((i) => i.id), ["d", "a", "c"]);
  assert.deepEqual(orderPinned(items, []).map((i) => i.id), ["a", "c", "d"]);
});

test("moving a dish puts it before the target", () => {
  assert.deepEqual(moveBefore(["a", "b", "c"], "c", "a"), ["c", "a", "b"]);
  assert.deepEqual(moveBefore(["a", "b", "c"], "a", "c"), ["b", "a", "c"]);
  assert.deepEqual(moveBefore(["a", "b"], "a", "zzz"), ["a", "b"]);
});

test("a new choice becomes pins and unpins", () => {
  assert.deepEqual(pinChanges(["a", "b"], ["b", "c"]), { pin: ["c"], unpin: ["a"] });
});

test("there is no limit on pins", () => {
  const ids = Array.from({ length: 12 }, (_, n) => String(n));
  assert.deepEqual(pinChanges([], ids).pin, ids);
});
