const sharedConfig = require("@mirakart/config/eslint-preset");

module.exports = [
  ...sharedConfig,
  {
    // NestJS resolves constructor-injected dependencies (and ValidationPipe
    // resolves @Body()/@Query() DTOs) via reflect-metadata's design:paramtypes,
    // which requires a real value import. `consistent-type-imports` cannot
    // tell DI-significant imports apart from purely-type-level ones and its
    // autofix converts them to `import type`, which TypeScript then elides
    // from emitted JS entirely — silently breaking DI at runtime. Disabled
    // here; safe to keep enabled in non-Nest packages.
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
