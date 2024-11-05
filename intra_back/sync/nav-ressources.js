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

bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'nav_ressources'",
    function (error, result, fields) {

    });
/*
RESSOURCES
 */
var started = false;
var DATAS = [];

var IN_NAV = [];

var TO_INSERT = [];

var res = request('GET', 'https://api.cuppens.fr/api/resources'); // /resources/:id
var json = res.getBody().toString();
var j = JSON.parse(json);

j.value.forEach((el) => {
    IN_NAV.push(el);
}) ;

bdd.query('SELECT * FROM resources', function (error, result, fields) {
        if (error) throw error;

        //console.log("Working, length : " + result.length);
        if (result.length == 0) {
            IN_NAV.forEach((el) => {
                el._done = false;
                DATAS.push(el);

                insertData(el.No, el.Name, el.Global_Dimension_1_Code, el_nav.Gen_Prod_Posting_Group, Job_Cost_Code);
            });
        } else {
            IN_NAV.forEach((el_nav) => {
                var inBdd = false;

                result.forEach((el) => {
                    if(el.matricule_resource == el_nav.No){
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

                insertData(el.No, el.Name, el.Global_Dimension_1_Code, el.Gen_Prod_Posting_Group, el.Job_Cost_Code);
            });
            //console.log(TO_INSERT);

        }

        started = true;
});


function checkUpdate(el_sql, el_nav){
    var sql = "UPDATE resources SET matricule_resource = ?";
    var toUpdate = false;
    var args = [];

    var typeRes = '';

    if(el_nav.Gen_Prod_Posting_Group == '')
        typeRes = 'STAGIAIRE';
    else
        typeRes = el_nav.Gen_Prod_Posting_Group;

    el_nav.Job_Cost_Code = (el_nav.Job_Cost_Code == '' ? null:el_nav.Job_Cost_Code)

    args.push(el_nav.No);

    if(el_sql.Nom != el_nav.Name){
        toUpdate = true;
        sql += ", Nom = ?";
        args.push(el_nav.Name);
    }
    if(el_sql.Activite != el_nav.Global_Dimension_1_Code){
        toUpdate = true;
        sql += ", Activite = ?";
        args.push(el_nav.Global_Dimension_1_Code);
    }
    if(el_sql.Type != typeRes){

        toUpdate = true;
        sql += ", Type = ?";
        args.push(typeRes);
    }
    if(el_sql.nature != el_nav.Job_Cost_Code){
        toUpdate = true;
        sql += ", nature = ?";
        args.push(el_nav.Job_Cost_Code);
    }

    if(toUpdate){
        el_nav._done = false;
        DATAS.push(el_nav);

        sql += " WHERE matricule_resource = ?";
        args.push(el_sql.matricule_resource);

        bdd.query(sql, args, function (error, results, fields) {
            if (error) throw error;


            const p = (e) => e.No == el_sql.matricule_resource;

            DATAS[DATAS.findIndex(p)]._done = true;

            //console.log(DATAS);

            console.log("Ressource " + el_nav.Name + " (" + el_nav.No + ") mise à jour");
            console.log(sql);
        });
    }
}

function insertData(matricule, nom, axe1, typeRes, codeNature){
    var c = (codeNature == '' ? null:codeNature);
    if(typeRes == '')
        typeRes = 'STAGIAIRE';

    bdd.query('INSERT INTO resources (matricule_resource, Nom, Activite, Type, nature) VALUES (?, ?, ?, ?, ?)', [matricule, nom, axe1, typeRes, c], function (error, results, fields) {
        if (error) throw error;

        const p = (e) => e.No == matricule;

        DATAS[DATAS.findIndex(p)]._done = true;

        console.log("Ressource " + nom + " (" + matricule + ") ajoutée");
    });
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
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'nav_ressources'",
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