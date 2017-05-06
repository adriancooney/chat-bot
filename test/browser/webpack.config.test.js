const path = require("path");
const defaultConfig = require("../../webpack.config");

module.exports = Object.assign(defaultConfig, {
    entry: path.resolve(__dirname, "../index.js"),
    output: {
        path: __dirname,
        filename: "index.js"
    }
});