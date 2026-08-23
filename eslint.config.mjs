import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module"
            }
        },
        plugins: {
            "@typescript-eslint": tsPlugin
        },
        rules: {
            // Include recommended TypeScript rules
            ...tsPlugin.configs.recommended.rules,
            
            // Add any custom rules below
            "@typescript-eslint/no-explicit-any": "warn"
        }
    }
];
