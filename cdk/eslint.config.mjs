import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import cdkPlugin from 'eslint-cdk-plugin';

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    files: ['lib/**/*.ts', 'bin/*.ts'],
    extends: [cdkPlugin.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        project: './tsconfig.json',
      },
    },
    plugins: {},
    rules: {},
  },
  {
    ignores: ['cdk.out', 'node_modules', '*.js'],
  }
);
