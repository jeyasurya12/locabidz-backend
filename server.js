require('dotenv').config();
const express = require('express');
var cors = require('cors')
const bodyParser = require("body-parser");
const connectDB = require('./db/connect')
const parseResponse = require('./middlewares/parseResponse');
const fs = require("fs");
const validateJwtToken = require('./middlewares/auth')
const { errors } = require('celebrate');
const registerSockets = require('./sockets/index');
const insertSeeds = require('./seeds');
const path = require('path');

const app = express();

app.use(cors())

// const port = process.env.SERVER_PORT || 8000
// const server = app.listen(port, () => console.log(`App listening on port ${port}!`));
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});


// build-in middleware
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
const io = registerSockets(server);
app.set('io', io)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(parseResponse)
app.use('/public', express.static('public'))

app.get('/health', (req, res) => {
    res.status(200).json({
        ok: true
    })
})

//public routes 
require("./routes/auth")(app);
require("./routes/admin")(app);

//private routes
app.use(validateJwtToken)
require("./routes/user")(app);
require("./routes/attachment")(app);
require("./routes/review")(app);
require("./routes/common")(app);
require("./routes/post")(app);
require("./routes/proposal")(app);
require("./routes/chat")(app);
require("./routes/offer")(app);
require("./routes/contract")(app);
require("./routes/milestone")(app);
require("./routes/notification")(app);
require("./routes/transaction")(app);
require("./routes/support")(app);
require("./routes/wallet")(app);

// application middlewares
app.use('*', (req, res) => {
    res.sendError({
        message: 'No route found!',
        statusCode: 404
    })
});

app.use(errors());

const folderName = "public/uploads";
fs.mkdir(folderName, { recursive: true }, (err) => {
  if (err) {
    console.error(err);
  }
});

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await insertSeeds();
    } catch (err) {
        console.error(err?.message || err);
        process.exit(1);
    }
}
start();
