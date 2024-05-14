// vite.config.ts
import react from "file:///Users/aodhaganmurphy/projects/live-preview/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { resolve } from "path";
import { defineConfig } from "file:///Users/aodhaganmurphy/projects/live-preview/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/aodhaganmurphy/projects/live-preview/node_modules/vite-plugin-dts/dist/index.mjs";
import { configDefaults } from "file:///Users/aodhaganmurphy/projects/live-preview/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "/Users/aodhaganmurphy/projects/live-preview/packages/live-preview-sdk";
var vite_config_default = defineConfig({
  test: {
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      "src/rest/__tests__/constants.ts",
      "src/rest/__tests__/utils.ts",
      "src/rest/__tests__/fixtures/data.ts"
    ]
  },
  build: {
    sourcemap: true,
    outDir: "./dist",
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        react: resolve(__vite_injected_original_dirname, "src/react.tsx")
      },
      formats: ["cjs", "es"]
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: {
          react: "React"
        }
      }
    }
  },
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      exclude: ["**/__tests__/**"]
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYW9kaGFnYW5tdXJwaHkvcHJvamVjdHMvbGl2ZS1wcmV2aWV3L3BhY2thZ2VzL2xpdmUtcHJldmlldy1zZGtcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hb2RoYWdhbm11cnBoeS9wcm9qZWN0cy9saXZlLXByZXZpZXcvcGFja2FnZXMvbGl2ZS1wcmV2aWV3LXNkay92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYW9kaGFnYW5tdXJwaHkvcHJvamVjdHMvbGl2ZS1wcmV2aWV3L3BhY2thZ2VzL2xpdmUtcHJldmlldy1zZGsvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuaW1wb3J0IHsgY29uZmlnRGVmYXVsdHMgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgIC4uLmNvbmZpZ0RlZmF1bHRzLmV4Y2x1ZGUsXG4gICAgICAnc3JjL3Jlc3QvX190ZXN0c19fL2NvbnN0YW50cy50cycsXG4gICAgICAnc3JjL3Jlc3QvX190ZXN0c19fL3V0aWxzLnRzJyxcbiAgICAgICdzcmMvcmVzdC9fX3Rlc3RzX18vZml4dHVyZXMvZGF0YS50cycsXG4gICAgXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgb3V0RGlyOiAnLi9kaXN0JyxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC50cycpLFxuICAgICAgICByZWFjdDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvcmVhY3QudHN4JyksXG4gICAgICB9LFxuICAgICAgZm9ybWF0czogWydjanMnLCAnZXMnXSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ3JlYWN0J10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBkdHMoe1xuICAgICAgZW50cnlSb290OiAnc3JjJyxcbiAgICAgIGV4Y2x1ZGU6IFsnKiovX190ZXN0c19fLyoqJ10sXG4gICAgfSksXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVksT0FBTyxXQUFXO0FBQ25aLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsU0FBUyxzQkFBc0I7QUFKL0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLE1BQ1AsR0FBRyxlQUFlO0FBQUEsTUFDbEI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLFFBQ3hDLE9BQU8sUUFBUSxrQ0FBVyxlQUFlO0FBQUEsTUFDM0M7QUFBQSxNQUNBLFNBQVMsQ0FBQyxPQUFPLElBQUk7QUFBQSxJQUN2QjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLE9BQU87QUFBQSxNQUNsQixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxPQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsV0FBVztBQUFBLE1BQ1gsU0FBUyxDQUFDLGlCQUFpQjtBQUFBLElBQzdCLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
