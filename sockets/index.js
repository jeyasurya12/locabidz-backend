/* eslint-disable global-require */
// const ioEvents = require("./ioEvents");

// const init = (server) => {
//   var io = require("socket.io")(server);
//   ioEvents(io);
//   return io;
// };

// module.exports = init;



/* eslint-disable global-require */
const ioEvents = require("./ioEvents");

const init = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*", // Change this in production
      methods: ["GET", "POST"],
    },
  });

  // Global storage for agent assignment index
  global.agentIndex = {};

  ioEvents(io);
  return io;
};

module.exports = init;
