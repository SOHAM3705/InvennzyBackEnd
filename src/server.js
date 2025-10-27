const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('./db'); 
const path = require('path');
const app = express();

const contactusRoute = require('./routes/Contactus/contactusRoute');
const authRoutes = require('./routes/auth/authRoutes');
const settingAdminRoute = require('./routes/setting/settingadmin');
const labsRoute = require('./routes/Admin/labs');
const settingLabInchargeRoute = require('./routes/setting/labincharge');
const settingLabAssistantRoute = require('./routes/setting/assistantsetting');
const Request = require('./routes/Request/request');
const notificationRoute = require('./routes/Notification/notification');
const labStaffRoutes = require('./routes/LabStaff');
const labInchargeAssistantRoutes = require('./routes/labinchargeassisstant/labroutes');
const adminnotifications = require('./routes/Admin/notifications');
const deadstock = require('./routes/labinchargeassisstant/deadstock');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

app.use('/api', contactusRoute);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingAdminRoute);
app.use('/api/labs', labsRoute);
app.use('/api/settings', settingLabInchargeRoute);
app.use('/api/settings', settingLabAssistantRoute);
app.use('/api/requests', Request);
app.use('/api/notifications', notificationRoute);

app.use('/api/labstaff', labStaffRoutes);
app.use('/api', labInchargeAssistantRoutes);
app.use('/api', adminnotifications);
app.use('/api',deadstock);


app.listen(3000, () => console.log('Server running on http://localhost:3000'));
