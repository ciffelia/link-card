import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
	fmt: {
		ignorePatterns: ["worker-configuration.d.ts"],
	},
	lint: {
		plugins: ["vitest"],
		categories: {
			suspicious: "warn",
		},
		options: {
			typeAware: true,
			typeCheck: true,
		},
		jsPlugins: ["vite-plus/oxlint-plugin"],
		rules: {
			"vite-plus/prefer-vite-plus-imports": "error",
		},
	},
});
