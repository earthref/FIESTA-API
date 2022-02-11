module.exports = {
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/?(*.)+(tests)\\.ts'],
	moduleFileExtensions: ['js', 'ts', 'json'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	maxWorkers: '25%',
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	collectCoverage: false,
	collectCoverageFrom: ['**/*.ts', '!**/*.tests.ts'],
};
