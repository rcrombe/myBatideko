process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const request = require('sync-request');
const fs = require('fs');
const mysql = require('mysql');
const async = require('async');

var data = fs.readFileSync('config.json', 'utf8');

var CONF = JSON.parse(data);

var startDate = new Date().getTime();

console.log("[Authentication] Authentication token retrieved and stored");

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});

bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'nav_conducs'",
    function (error, result, fields) {

    });
/*
CHANTIERS
 */
var started = false;
var DATAS = [];

var IN_NAV = [];

var TO_INSERT = [];

bdd.query('SELECT Conducteur FROM chantiers WHERE Conducteur IS NOT NULL AND Conducteur != "" AND Conducteur NOT IN (SELECT initiales as Conducteur FROM conducteurs) GROUP BY Conducteur', function (error, result, fields) {
    if (error) throw error;

    if (result.length == 0) {
        console.log("Aucun conducteur à ajouter");
    } else {

        result.forEach((el) => {

            el._done = false;
            DATAS.push(el);

            bdd.query('INSERT INTO conducteurs (initiales) VALUES (?)',
                [el.Conducteur], function (error, results, fields) {
                    if (error) throw error;

                    const p = (e) => e.Conducteur == el.Conducteur;

                    DATAS[DATAS.findIndex(p)]._done = true;

                    console.log("Conducteur " + el.Conducteur + " ajouté");
                });
        });
    }

    started = true;
});

function checkAlive(){
    if(started) {
        var allGood = true;
        DATAS.forEach((el) => {
            if (el._done == false) {
                allGood = false;
            }
        });

        if (allGood) {
            bdd.end(() => {
                bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'nav_conducs'",
                    function (error, result, fields) {
                        bdd.end(() => {
                            console.log("Arrêt de la connexion");
                        });
                    });
                clearInterval(timer);
            });
        }
    }
}

var timer = setInterval(checkAlive, 1000);