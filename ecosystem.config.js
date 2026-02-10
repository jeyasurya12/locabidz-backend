module.exports = {
    apps: [
      {
        name: "contractor-backend",
        script: "server.js", // Entry point for your application
        instances: "max", // You can set this to a number for specific instance count
        exec_mode: "cluster", // You can use "fork" mode as well
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "production",
          PORT: 4001, // Your application's port
        },
        env_production: {
          NODE_ENV: "production",
          PORT: 4001,
        },
      },
    ],
  };
