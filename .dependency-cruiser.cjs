/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-imports-only-domain",
      comment:
        "The domain stays portable: no apps, node: modules or external packages (the schema library will be allowed).",
      severity: "error",
      from: { path: "^packages/domain/" },
      to: { pathNot: "^packages/domain/" },
    },
    {
      name: "server-never-imports-web",
      severity: "error",
      from: { path: "^apps/server/" },
      to: { path: "^apps/web/" },
    },
    {
      name: "web-never-imports-server",
      severity: "error",
      from: { path: "^apps/web/" },
      to: { path: "^apps/server/" },
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
      from: { path: "^(packages|apps)/[^/]+/src/" },
      to: { path: ["^(packages|apps)/[^/]+/tests/", "\\.test(-d)?\\.tsx?$"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|coverage)/" },
    // dependency-cruiser cannot use the TypeScript 7 compiler yet.
    parser: "swc",
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js"],
    },
  },
};
