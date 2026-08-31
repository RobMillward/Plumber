module.exports = {
  moduleNameMapper: {
    "\\.css$": "<rootDir>/jest.cssMock.js",
    "\\.(png|jpe?g|gif|svg)$": "<rootDir>/jest.imageMock.js",
    "~/(.*)$": "<rootDir>/src/$1"
  },
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
    "/dist/"
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts"
  ],
}
