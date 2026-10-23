import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

let email = process.env.OVYRO_ADMIN_EMAIL?.trim();
if (!email) {
  const rl = createInterface({ input: stdin, output: stdout });
  email = (await rl.question("Admin email: ")).trim();
  rl.close();
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid admin email.");
if (!stdin.isTTY || typeof stdin.setRawMode !== "function") throw new Error("Run this command in an interactive terminal so the password can be entered without echo.");

stdout.write("Admin password (hidden): ");
stdin.setRawMode(true);
stdin.resume();
const password = await new Promise((resolve, reject) => {
  let value = "";
  const onData = chunk => {
    const key = chunk.toString("utf8");
    if (key === "\u0003") { stdin.setRawMode(false); reject(new Error("Cancelled.")); return; }
    if (key === "\r" || key === "\n") { stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData); stdout.write("\n"); resolve(value); return; }
    if (key === "\u007f" || key === "\b") { value = value.slice(0, -1); return; }
    if (key >= " " && key !== "\u007f") value += key;
  };
  stdin.on("data", onData);
});
if (password.length < 12) throw new Error("Choose a password with at least 12 characters.");
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
const sessionSecret = randomBytes(32).toString("base64url");
let databaseLine = "";
try { databaseLine = readFileSync(".env.local", "utf8").split(/\r?\n/).find(line => line.startsWith("DATABASE_URL=")) ?? ""; } catch { /* create the file below */ }
const file = `OVYRO_ADMIN_EMAIL=${email.toLowerCase()}\nOVYRO_ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${hash.toString("hex")}\nOVYRO_SESSION_SECRET=${sessionSecret}\n${databaseLine ? `${databaseLine}\n` : ""}`;
writeFileSync(".env.local", file, { mode: 0o600 });
stdout.write("Local admin configured. The password was stored as a scrypt hash in the git-ignored .env.local file.\n");
