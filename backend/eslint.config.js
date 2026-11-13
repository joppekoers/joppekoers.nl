import js from '@eslint/js'
import prettier from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['build/'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettier,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.node,
		},
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
