import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTsModuleSync } from "../helpers/load-ts.js";

const utils = loadTsModuleSync("@/lib/utils");

test("cn merges class names and resolves conflicts", () => {
  assert.equal(utils.cn("text-sm", undefined, "font-bold"), "text-sm font-bold");
  assert.equal(utils.cn("px-2", "px-4"), "px-4");
});
