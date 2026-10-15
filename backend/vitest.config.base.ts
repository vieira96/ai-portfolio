// Shared base for every vitest config in this project.
// Each suite adds only its include/exclude/timeouts here —
// common settings (resolve, globals, root) change in one place.
export const baseConfig = {
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
  },
};
