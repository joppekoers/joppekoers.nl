import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['build/', 'dist/', '.svelte-kit/', 'package/'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte'],
			},
		},
	},
	{
		rules: {
			'array-callback-return': 'error',
			curly: ['error', 'all'],
			'no-array-constructor': 'error',
			'no-duplicate-imports': ['error', { includeExports: true }],
			'no-extend-native': 'error',
			'no-nested-ternary': 'error',
			'no-return-assign': 'error',
			'no-return-await': 'error',
			'no-throw-literal': 'error',
			'no-unreachable-loop': 'error',
			'no-unused-private-class-members': 'error',
			'no-useless-catch': 'error',
			'no-useless-escape': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'prefer-template': 'error',
			'require-await': 'error',
			'no-constant-condition': ['error', { checkLoops: false }],
			eqeqeq: ['error', 'smart'],
			'@typescript-eslint/ban-ts-comment': 'off',
		},
	},
)
