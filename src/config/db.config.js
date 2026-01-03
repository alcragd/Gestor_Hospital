// Instala: npm install mssql
const sql = require('mssql');

const config = {
    user: 'javauser', 
    password: 'user', 
    server: 'localhost', 
    database: 'GestorHospitalDB', 
    options: {
        encrypt: false, 
        trustServerCertificate: true,
        language: 'Spanish'
    }
};

const pool = new sql.ConnectionPool(config);

// Exportar una función que retorne la conexión para usarla en los servicios
module.exports = {
    sql,
    connect: () => pool.connect()
};