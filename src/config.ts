import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-prompt-ladder",
  description: "A browser-local staged discussion prompt ladder for groups.",
  accentHex: "#0f766e",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
