import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import path from "node:path"
import { fileURLToPath } from "node:url"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import testingLibrary from "eslint-plugin-testing-library"
import reactHooks from "eslint-plugin-react-hooks"
import react from "eslint-plugin-react"
import jest from "eslint-plugin-jest"
import { FlatCompat } from "@eslint/eslintrc"
import { fixupPluginRules } from "@eslint/compat"
import globals from "globals"
import tsParser from "@typescript-eslint/parser"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
  allConfig: tseslint.configs.all,
})

export default defineConfig([
  {
  files: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
  ],

  extends: compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
    "plugin:react/recommended",
  ),

  plugins: {
    react,
    jest,
    "@typescript-eslint": typescriptEslint,
    "react-hooks": fixupPluginRules(reactHooks),
    "testing-library": testingLibrary,
  },

  languageOptions: { 
    globals: {
      ...globals.node,
      ...globals.browser,
      ...jest.environments.globals.globals
    },

    parser: tsParser,
    ecmaVersion: 6,
    sourceType: 'module',

    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  settings: {
    react: {
      version: "detect",
    },
  },

  rules: {
    "react/react-in-jsx-scope": ["off"],
    "@typescript-eslint/no-explicit-any": "off",
  },
}, {
  files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
  extends: compat.extends("plugin:testing-library/react"),
  
}

]
);