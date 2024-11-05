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
bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'nav_st'",
    function (error, result, fields) {

    });
/*
RESSOURCES
 */
var started = false;
var DATAS = [];

var IN_NAV = [];

var TO_INSERT = [];

var res = request('GET', 'https://api.cuppens.fr/api/st'); // /resources/:id
var json = res.getBody().toString();
var j = JSON.parse(json);

j.value.forEach((el) => {
    IN_NAV.push(el);
}) ;


bdd.query('SELECT * FROM resources_st', function (error, result, fields) {
    if (error) throw error;

    if (result.length == 0) {
        IN_NAV.forEach((el) => {
            el._done = false;

            DATAS.push(el);

            insertData(el.No, el.Name);
        });
    } else {
        IN_NAV.forEach((el_nav) => {
            var inBdd = false;

            result.forEach((el) => {
                if(el.code == el_nav.No){
                    inBdd = true;

                    checkUpdate(el, el_nav);
                }
            });

            if(!inBdd){

                TO_INSERT.push(el_nav);
            }
        });

        TO_INSERT.forEach((el) => {
            el._done = false;

            DATAS.push(el);
            insertData(el.No, el.Name);
        });
    }

    started = true;
});

function checkUpdate(el_sql, el_nav){
    var sql = "UPDATE resources_st SET code = ?";
    var toUpdate = false;
    var args = [];

    args.push(el_nav.No);

    if(el_sql.Nom !== el_nav.Name){
        toUpdate = true;
        sql += ", Nom = ?";
        args.push(el_nav.Name);
    }

    if(toUpdate === true){
        el_nav._done = false;
        DATAS.push(el_nav);

        sql += " WHERE code = ?";
        args.push(el_sql.code);

        bdd.query(sql, args, function (error, results, fields) {
            if (error) throw error;

            const p = (e) => e.No == el_sql.code;

            DATAS[DATAS.findIndex(p)]._done = true;

            console.log("Sous-traitant " + el_nav.No + " (" + el_nav.Name + ") mis à jour");
        });
    }
}

function insertData(code, nom){
    bdd.query('INSERT INTO resources_st (code, Nom) VALUES (?, ?)', [code, nom], function (error, results, fields) {
        if (error) throw error;

        const p = (e) => e.No == code;

        DATAS[DATAS.findIndex(p)]._done = true;

        console.log("Sous-traitant " + nom + " (" + code + ") ajouté");
    });
}


function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done === false)
                allGood = false;
        });

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'nav_st'",
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
