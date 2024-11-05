process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const request = require('sync-request');
const fs = require('fs');
const mysql = require('mysql');

var data = fs.readFileSync('config.json', 'utf8');

var CONF = JSON.parse(data);

console.log("[Authentication] Authentication token retrieved and stored");

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});

bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'nav_nature'",
    function (error, result, fields) {

    });
/*
CODES NATURE
 */
var started = false;
var DATAS = [];

var IN_NAV = [];

var TO_INSERT = [];

var res = request('GET', 'https://api.cuppens.fr/api/codes_nature'); // /resources/:id
var json = res.getBody().toString();
var j = JSON.parse(json);


j.value.forEach((el) => {
    IN_NAV.push(el);
});

bdd.query('SELECT * FROM codes_nature', function (error, result, fields) {
    if (error) throw error;

    if (result.length == 0) {
        IN_NAV.forEach((el) => {
            if(el.Code != "." && el.Code > 200 && el.Code <= 299) {
                el._done = false;
                DATAS.push(el);

                insertData(el.Code, el.Name);
            }
        });
    } else {
        IN_NAV.forEach((el_nav) => {
            var inBdd = false;


            result.forEach((el) => {
                if(el.code == el_nav.Code){
                    inBdd = true;

                    checkUpdate(el, el_nav);
                }
            });

            if(!inBdd){
                if(el_nav.Code != "." && el_nav.Code > 200 && el_nav.Code <= 299)
                    TO_INSERT.push(el_nav);
            }
        });

        TO_INSERT.forEach((el) => {

            el._done = false;
            DATAS.push(el);

            insertData(el.Code, el.Name);
        });
    }

    started = true;
});

function insertData(code, name){
    bdd.query('INSERT INTO codes_nature (code, libelle) VALUES (?, ?)',
        [code, name], function (error, results, fields) {
            if (error) throw error;

            const p = (e) => e.Code == code;

            DATAS[DATAS.findIndex(p)]._done = true;

            console.log("Code nature " + code + " (" + name + ") ajouté");
        });
}

function checkUpdate(el_sql, el_nav){
    var sql = "UPDATE codes_nature SET code = ?";
    var toUpdate = false;
    var args = [];

    args.push(el_nav.Code);

    if(el_sql.libelle != el_nav.Name){
        toUpdate = true;
        sql += ", libelle = ?";
        args.push(el_nav.Name);
    }

    if(toUpdate){
        el_nav._done = false;
        DATAS.push(el_nav);

        sql += " WHERE code = ?";
        args.push(el_sql.code);

        bdd.query(sql, args, function (error, results, fields) {
            if (error) throw error;

            const p = (e) => e.Code == el_sql.code;

            DATAS[DATAS.findIndex(p)]._done = true;

            console.log("Code nature " + el_nav.Code + " (" + el_nav.Name + ") mis à jour");
        });
    }
}

function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done = false) {
                allGood = false;
            }
        });

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'nav_nature'",
                function (error, result, fields) {
                    bdd.end(() => {
                        console.log("Arrêt de la connexion");
                    });
                });
            clearInterval(timer);
        }
    }
}

var timer = setInterval(checkAlive, 1000);

