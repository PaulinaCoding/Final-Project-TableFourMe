require('dotenv').config();
const bodyParser = require('body-parser');
const { updateFormData, submitNewFormData, cancelReservation } = require('../libs/reservation-func.js');
const { updateReservationStatus } = require('../libs/status-func.js');

//PORT for Express Server, Sockets will use the same server and port
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const serv = require('./servHelpers');

const massive = require('massive');
const connectionString = process.env.DATABASE_URL;
const countClients = ws => Object.keys(ws.sockets.connected).length;

app.use(express.static(__dirname + '/build'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



massive(connectionString)
  .then(db => {
    console.log('Connection to PSQL established.');
    const apiRoutes = require('../routes/api/index')(db);
    app.use('/api', apiRoutes);

    io.on('connection', socket => {
      console.log(`${countClients(io)} CLIENT(S) CONNECTED`);
      socket.on('disconnect', () => {
        console.log(`${countClients(io)} CLIENT(S) CONNECTED`);
      });

      socket.on('submitReservation', formReservation => {
        submitNewFormData(db, io, formReservation);
      })

      socket.on('updateReservation', formReservation => {
        updateFormData(db, io, formReservation);
      })

      socket.on('cancelReservation', formReservation => {
        cancelReservation(db, io, formReservation);
      })

      socket.on('updateReservationStatus', status => {
        updateReservationStatus(db, io, status);
      })

      socket.on('getAllReservations', status => {
        serv.getAllReservations(db)
        .then(data => {
          io.emit('AllReservations', data);
        })
      })
      socket.on('getAllMenuItemOrders', status => {
        serv.getAllMenuItemOrders(db)
        .then(data => {
          io.emit('AllMenuItemOrders', data);
        })
      })
      socket.on('getItemOrdersWMenuItemInfo', status => {
        serv.getItemOrdersWMenuItemInfo(db)
        .then(data => {
          io.emit('ItemOrdersWMenuItemInfo', data);
        })
      })
      socket.on('addItemToOrder', status => {
        serv.addItemToOrder(db)
        .then(data => {
          io.emit('NewOrderAdded', data);
        })
      })
    })
  })
  .catch(err => {
    console.log(err.stack);
  });

server.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT} in ${ENV} mode.`);
});
