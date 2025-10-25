import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { loadTsModuleSync } from "../helpers/load-ts.js";

const IndexPage = loadTsModuleSync("@/pages/Index");

function renderIndex() {
  return renderToString(React.createElement(IndexPage));
}

test("Index page renders hero heading and call to action", () => {
  const html = renderIndex();
  assert.match(html, /Bienvenido a Navia/);
  assert.match(html, /Haz clic en el botón flotante para comenzar/);
});

test("Index page includes floating button label", () => {
  const html = renderIndex();
  assert.match(html, /Navia<\/span>/);
});
