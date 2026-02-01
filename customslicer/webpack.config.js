const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            compilerOptions: {
                                skipLibCheck: true
                            }
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    }
};
