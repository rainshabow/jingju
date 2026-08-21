import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// 从当前文件所在目录向上两级找到项目根目录的 .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = join(__dirname, "..", "..", "..", ".env");

config({ path: rootEnv, override: true });
