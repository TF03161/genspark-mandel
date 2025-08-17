module.exports = {
  apps: [
    {
      name: 'threejs-mandelbulb',
      script: 'npx',
      args: 'http-server . -p 3000 --cors -c-1',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}