"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var zod_1 = require("zod");
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["dev", "test", "production"]).default("dev"),
    GROQ_API_KEY: zod_1.z.coerce.string(),
    PORT: zod_1.z.coerce.number().default(3333),
    JWT_SECRET: zod_1.z.coerce.string(),
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
    console.error("❌ Invalid environment variables", _env.error.format());
    throw new Error("Invalid environment variables.");
}
exports.env = _env.data;
