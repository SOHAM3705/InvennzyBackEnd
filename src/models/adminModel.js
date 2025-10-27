const db = require('../db');

const createAdmin = (admin, callback)  => {
    const { email, password, name } = admin;
    db.query(
        'INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
        [email, password, name],
        (error, results) => {
            if (error) {
                return callback(error);
            }
            callback(null, results);
        }
    );
};

const findAdminByEmail = (email, callback) => {
    db.query(
        'SELECT * FROM admins WHERE email = ?',
        [email],
        (error, results) => {
            if (error) {
                return callback(error);
            }
            if (results.length === 0) {
                return callback(null, null);
            }
            callback(null, results[0]);
        }
    );
}

module.exports = { createAdmin, findAdminByEmail };