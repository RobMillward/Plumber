const { default: plugin } = require("eslint-plugin-jest");

module.exports = {
    presets: [
       [ "@babel/preset-env", {targets: {node: 'current'} } ], 
        "@babel/preset-typescript"
    ],
    plugins: ["@babel/plugin-transform-react-jsx"],
}