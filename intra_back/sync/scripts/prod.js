process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const request = require('sync-request');
const fs = require('fs');
const mysql = require('mysql');

var data = fs.readFileSync('config.json', 'utf8');

var CONF = JSON.parse(data);

console.log("[Authentication] Authentication token retrieved and stored");

const bdd_prod = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: 'intranet_dev',
    multipleStatements: true
});



bdd.query('SELECT * FROM resources WHERE id_mytime IS NOT NULL', function (error, result, fields) {
    if (error) throw error;

    result.forEach((el) => {
        bdd_prod.query('UPDATE resources set id_mytime = ?, password_mytime = ? WHERE matricule_resource = ?', [el.id_mytime, el.password_mytime,el.matricule_resource], function (error, result, fields) {
            if (error) throw error;

            console.log("Element mis à jour : " + JSON.stringify(el));

        });
    });

});

 /*

bdd.query('SELECT * FROM chantiers', function (error, result, fields) {
    if (error) throw error;

    result.forEach((el) => {
        bdd_prod.query('UPDATE chantiers set id_mytime = ?, code_pointage = ?, password_mytime = ? WHERE code_chantier = ?', [el.id_mytime, el.code_pointage,el.password_mytime,el.code_chantier], function (error, result, fields) {
            if (error) throw error;

            console.log("Element mis à jour : " + JSON.stringify(el));

        });
    });

});*/