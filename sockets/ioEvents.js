// const ioEvents = (io) => {
//   var socketIds = {};
//   var usersInOnline = [];

//   io.on("connect", (socket) => {
//     socket.on("JOIN", (id) => {
//       console.log("s--s>>>>>>>>>>>>>>>join>>>.", id);
//       socketIds[socket.id] = id;
//       usersInOnline.push(id);
//       socket.join(id); // We are using room of socket io
//     });

//     socket.on("NEW_MESSAGE", (msg) => {
//       console.log("s-s-s>>>>>>>>>.socker msg", msg);
//       switch (msg.type) {
//         case "OPPONENT_STATE":
//           io.to(msg.data.receiverId).emit("RECEIVE_MESSAGE", msg);
//           break;
//         case "NEW_MATCH":
//           io.emit("RECEIVE_MESSAGE", msg);
//           break;
//         case "START_MATCH":
//           console.log("s-s-s>>>>>>>>>.socker msg", msg);
//           io.to(msg.data.receiverId).emit("RECEIVE_MESSAGE", msg);
//           break;

//         default:
//           break;
//       }
//     });

//   });
// };

// module.exports = ioEvents;



const ioEvents = (io) => {
  var socketIds = {};
  var usersOnline = [];
  var usersInOnline = {};

  io.on("connect", (socket) => {
    socket.on("JOIN", (id) => {
      console.log("s--s>>>>>>>>>>>>>>>join>>>.", id);
      socketIds[socket.id] = id;
      usersOnline.push(id);
      socket.join(id); // We are using room of socket io
    });
    socket.on("JOIN", (data) => {
      const { id, role, category } = data;
      console.log("Agent/User Joined:", id, role, category);

      socketIds[socket.id] = id;
      socket.join(id); // Assign socket to a unique room

      // Store agents separately for auto-assignment
      if (role === "agent") {
        if (!usersInOnline[category]) {
          usersInOnline[category] = [];
        }
        usersInOnline[category].push({ id, socketId: socket.id });
      }
    });

    socket.on("NEW_MESSAGE", (msg) => {
      console.log("s-s-s>>>>>>>>>.socker msg", msg);
      switch (msg.type) {
        case "OPPONENT_STATE":
          io.to(msg.data.receiverId).emit("RECEIVE_MESSAGE", msg);
          break;
        case "NEW_MATCH":
          io.emit("RECEIVE_MESSAGE", msg);
          break;
        case "START_MATCH":
          console.log("s-s-s>>>>>>>>>.socker msg", msg);
          io.to(msg.data.receiverId).emit("RECEIVE_MESSAGE", msg);
          break;

        default:
          break;
      }
    });
    socket.on("NEW_TICKET", async (ticket) => {
      console.log("New Support Ticket:", ticket);

      const { category } = ticket;

      if (!usersInOnline[category] || usersInOnline[category].length === 0) {
        return io.to(ticket.userId).emit("TICKET_ASSIGNMENT_FAILED", {
          message: "No available agents for this category",
        });
      }

      // Round-robin agent selection
      let assignedAgentIndex = global.agentIndex[category] || 0;
      assignedAgentIndex = assignedAgentIndex % usersInOnline[category].length;
      const assignedAgent = usersInOnline[category][assignedAgentIndex];

      // Update index for next assignment
      global.agentIndex[category] = (assignedAgentIndex + 1) % usersInOnline[category].length;

      // Emit event to the assigned agent
      io.to(assignedAgent.socketId).emit("NEW_TICKET_ASSIGNED", {
        message: "A new support ticket has been assigned to you",
        ticket,
      });

      // Notify the user
      io.to(ticket.userId).emit("TICKET_ASSIGNED", {
        message: "Your support ticket has been assigned",
        agentId: assignedAgent.id,
      });

      console.log(`Ticket assigned to agent: ${assignedAgent.id}`);
    });

    socket.on("disconnect", () => {
      if (socketIds[socket.id]) {
        const disconnectedUserId = socketIds[socket.id];

        // Remove agent from the online list
        Object.keys(usersInOnline).forEach((category) => {
          usersInOnline[category] = usersInOnline[category].filter(
            (agent) => agent.id !== disconnectedUserId
          );
        });

        delete socketIds[socket.id];
        console.log(`Agent/User disconnected: ${disconnectedUserId}`);
      }
    });
  });
};

module.exports = ioEvents;
