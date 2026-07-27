import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("Hello World worker", () => {
	it("responds with Hello World!", async () => {
		const res = await app.request("/", {}, env);
		expect(await res.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});
});
