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
    }
  };
  