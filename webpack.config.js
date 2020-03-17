const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config = {
    mode: process.env.NODE_ENV || 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        library: 'sqlFormatter',
        libraryTarget: 'umd',
    },
    plugins: [new webpack.optimize.OccurrenceOrderPlugin()],
};

if (process.env.NODE_ENV === 'production') {
    config.optimization = {
        minimizer: [
            new UglifyJSPlugin({
                sourceMap: true,
            }),
        ],
    };
}

module.exports = config;
