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
        language: 'Spanish',
        useUTC: false // Mantener fechas/horas en zona local para evitar desfase en bitácoras
    }
};

const pool = new sql.ConnectionPool(config);

// Exportar una función que retorne la conexión para usarla en los servicios
module.exports = {
    sql,
    connect: () => pool.connect()
};