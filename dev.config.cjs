let appName = 'drag-sortable-list'

module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [{
            name: appName + '-web',
            script: './web-server.js',
            "env": {
                PORT: 3000,
				NODE_ENV: 'development',
            }
        },
        {
            "name": appName + '-bg',
            "script": "npm",
            "args": "run pm2-bg"
        }
    ]
};
