import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/features/menu/models/menuSets.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { quantitySets, addOnSets, quantitySummary } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const item = (id, quantities, addOnIds) => ({ id, quantities, addOnIds });
const half = [{ name: "Half", price: 180 }, { name: "Full", price: 290 }];

test("identical quantity sets show once, most used first, without the dish being edited", () => {
  const sets = quantitySets(
    [item("a", [{ name: "Mini", price: 149 }], []), item("b", half, []), item("c", half, []), item("me", half, [])],
    "me",
  );
  assert.equal(sets.length, 2);
  assert.equal(sets[0].usedIn, 2);
  assert.deepEqual(sets[0].rows, half);
});

test("add-on sets ignore order and duplicates, and skip dishes with none", () => {
  const sets = addOnSets([item("a", [], ["x", "y"]), item("b", [], ["y", "x", "x"]), item("c", [], [])]);
  assert.equal(sets.length, 1);
  assert.equal(sets[0].usedIn, 2);
  assert.deepEqual(sets[0].ids, ["x", "y"]);
});

test("the summary joins names and prices", () => {
  assert.equal(quantitySummary(half, (n) => `₹${n}`), "Half ₹180 · Full ₹290");
  assert.equal(quantitySummary([{ name: " ", price: 1 }, { name: "Pack", price: null }], (n) => `₹${n}`), "Pack");
});
