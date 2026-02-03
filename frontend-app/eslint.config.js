import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsdoc from "eslint-plugin-jsdoc";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
   globalIgnores(["dist"]),
   {
      files: ["**/*.{js,jsx}"],
      plugins: {
         jsdoc,
         "react-hooks": reactHooks,
         "react-refresh": reactRefresh
      },
      rules: {
         ...js.configs.recommended.rules,
         ...reactHooks.configs["recommended-latest"].rules,
         ...reactRefresh.configs.vite.rules,
         ...jsdoc.configs.recommended.rules,
         "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
         "jsdoc/require-jsdoc": [
            "warn",
            {
               require: {
                  FunctionDeclaration: true,
                  MethodDefinition: true,
                  ClassDeclaration: true,
   //             ArrowFunctionExpression: true,
                  FunctionExpression: true,
               },
            },
         ],
      },
      languageOptions: {
         ecmaVersion: 2020,
         globals: globals.browser,
         parserOptions: {
            ecmaVersion: "latest",
            ecmaFeatures: { jsx: true },
            sourceType: "module",
         },
      },
   },
]);
