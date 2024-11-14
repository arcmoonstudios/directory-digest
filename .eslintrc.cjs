module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {
        'no-inner-declarations': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-require-imports': 'off', // Disabled require import rule
        '@typescript-eslint/naming-convention': [
            'warn',
            {
                'selector': 'variable',
                'format': ['camelCase', 'UPPER_CASE', 'snake_case'],
                'leadingUnderscore': 'allow'
            }
        ],
        'prefer-const': 'warn',
        'semi': 'off'
    },
    ignorePatterns: [
        'out',
        'dist',
        '**/*.d.ts',
        'node_modules'
    ]
};