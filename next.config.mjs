import { baseNextConfig } from "nextjs-secure-config";

export default {
  ...baseNextConfig(),
  serverExternalPackages: ["bun:sqlite"],
};
