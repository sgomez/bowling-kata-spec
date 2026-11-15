/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-imports-only-domain",
      comment:
        "The domain stays portable: no presentation, CLI, input, node: modules or external packages.",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: "^src/domain/" },
    },
    {
      name: "presentation-imports-only-domain",
      severity: "error",
      from: { path: "^src/presentation/" },
      to: { pathNot: "^src/(domain|presentation)/" },
    },
    {
      name: "input-imports-only-domain",
      severity: "error",
      from: { path: "^src/input/" },
      to: { pathNot: "^src/(domain|input)/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "production-never-imports-tests",
      severity: "error",
      from: { path: "^src/" },
      to: { path: ["^tests/", "\\.test(-d)?\\.ts$"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // dependency-cruiser cannot use the TypeScript 7 compiler yet.
    parser: "swc",
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".js"],
    },
  },
};
