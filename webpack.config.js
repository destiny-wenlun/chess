const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	entry: "./src/index.ts",
	output: {
		filename: 'chess.min.js',
		path: __dirname + '/dist'
	},
	module: {
		rules: [
			{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }
		]
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	plugins: [
		new UglifyJSPlugin()
	]
}