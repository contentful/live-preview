module.exports = {
    extends: require.resolve('../../.eslintrc.cjs'),
    "plugins": [
      "import"
    ],
    "rules": {
      "import/extensions": ["error", "ignorePackages"]      
    },
    settings: {
      "import/resolver": {
        "node": {
          "extensions": [".js", ".ts"]
        }
      }
    },
    overrides: [
      {
        files: ["*.spec.js", "*.spec.ts"],
        rules: {
          "import/extensions": "off"
        }
      }
    ]
  };
  