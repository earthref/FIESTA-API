module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'prettier/@typescript-eslint',
	],
	env: {
		es6: true,
		browser: true,
		jest: true,
		node: true,
	},
	rules: {
		'@typescript-eslint/explicit-function-return-type': 0,
		'@typescript-eslint/explicit-member-accessibility': 0,
		'@typescript-eslint/indent': 0,
		'@typescript-eslint/member-delimiter-style': 0,
		'@typescript-eslint/no-explicit-any': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/no-unused-vars': [
			2,
			{
				argsIgnorePattern: '^_',
			},
		],
		'no-console': process.env.NODE_ENV === 'production' ? 2 : 0,
		'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
	},
};
