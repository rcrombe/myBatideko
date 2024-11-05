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


/*
CHANTIERS
 */
var started = false;
var DATAS = [];

var IN_NAV = [];

var TO_INSERT = [];

var d = new Date().getTime();
var time = (d - startDate)/1000;

console.log("[ " + time + " ] Requesting Jobs list");

var res = request('GET', 'https://api.cuppens.fr/api/jobs'); // /resources/:id
var json = res.getBody().toString();
var j = JSON.parse(json);

j.value.forEach((el) => {
    var res_detail = request('GET', 'https://api.cuppens.fr/api/jobs/' + el.No);
    var json_detail = res_detail.getBody().toString();
    var j_detail = JSON.parse(json_detail);

    IN_NAV.push(j_detail.value[0]);
});


//console.log(IN_NAV[851]);

var d = new Date().getTime();
var time = (d - startDate)/1000;

console.log("[ " + time + " ] Finished requesting Jobs list");

bdd.query('SELECT * FROM chantiers', function (error, result, fields) {
    if (error) throw error;

    if (result.length == 0) {
        IN_NAV.forEach((el) => {
            el._done = false;
            DATAS.push(el);

            insertData(el.No, el.Description, el.Bill_to_City, el.Person_Responsible,el.Job_Status, el.Travel_Code,
                el.Bill_to_Address,
                el.Bill_to_Address_2,
                el.Bill_to_Post_Code,
                el.Treeview_Code);
        });

    } else {
        IN_NAV.forEach((el_nav) => {
            //console.log(el_nav)
            var inBdd = false;

            result.forEach((el) => {
                if(el.code_chantier == el_nav.No){
                    inBdd = true;

                    checkUpdate(el, el_nav);
                }
            });

            if(!inBdd){
                el_nav._done = false;
                DATAS.push(el_nav);

                insertData(el_nav.No, el_nav.Description, el_nav.Bill_to_City, el_nav.Person_Responsible,el_nav.Job_Status, el_nav.Travel_Code,
                    el_nav.Bill_to_Address,
                    el_nav.Bill_to_Address_2,
                    el_nav.Bill_to_Post_Code,
                    el_nav.Treeview_Code);
            }
        });

    }

    started = true;
});

function insertData(code_chantier, description, ville, conducteur, status, zone, adresse, adresse2, cp, code_classification){
    if(code_chantier !== null) {
        var actif = (status == "3-ENCOURS" ? "1" : "0");
        bdd.query('INSERT INTO chantiers (code_chantier, nom_chantier, Ville, Conducteur, Actif, zone, adresse, adresse2, code_postal, code_classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [code_chantier, description, ville, conducteur, actif, zone, adresse, adresse2, cp, code_classification], function (error, results, fields) {
                if (error) throw error;

                const p = (e) => e.No == code_chantier;

                DATAS[DATAS.findIndex(p)]._done = true;

                console.log("Chantier " + description + " (" + code_chantier + ") ajouté");
            });
    }
}

function checkUpdate(el_sql, el_nav){
    var sql = "UPDATE chantiers SET Actif = ?";
    var toUpdate = false;
    var args = [];

    var tCode = el_nav.Travel_Code === '' ? null:el_nav.Travel_Code;

    args.push((el_nav.Job_Status == "3-ENCOURS" ? 1:0));

    if((el_sql.Actif == 1 && el_nav.Job_Status != "3-ENCOURS") || (el_sql.Actif == 0 && el_nav.Job_Status == "3-ENCOURS"))
        toUpdate = true;
    if(el_sql.nom_chantier != el_nav.Description){
        toUpdate = true;
        sql += ", nom_chantier = ?";
        args.push(el_nav.Description);
    }
    if(el_sql.Ville != el_nav.Bill_to_City){
        toUpdate = true;
        sql += ", Ville = ?";
        args.push(el_nav.Bill_to_City);
    }
    if(el_sql.Conducteur != el_nav.Person_Responsible){
        toUpdate = true;
        sql += ", Conducteur = ?";
        args.push(el_nav.Person_Responsible);
    }
    if(el_sql.zone != tCode){
        toUpdate = true;
        sql += ", zone = ?";
        args.push(el_nav.Travel_Code);
    }
    if(el_sql.adresse != el_nav.Bill_to_Address){
        toUpdate = true;
        sql += ", adresse = ?";
        args.push(el_nav.Bill_to_Address);
    }
    if(el_sql.adresse2 != el_nav.Bill_to_Address_2){
        toUpdate = true;
        sql += ", adresse2 = ?";
        args.push(el_nav.Bill_to_Address_2);
    }
    if(el_sql.code_postal != el_nav.Bill_to_Post_Code){
        toUpdate = true;
        sql += ", code_postal = ?";
        args.push(el_nav.Bill_to_Post_Code);
    }
    if(el_sql.code_classification != el_nav.Treeview_Code){
        toUpdate = true;
        sql += ", code_classification = ?";
        args.push(el_nav.Treeview_Code);

        console.log(el_nav.Treeview_Code);
    }

    if(toUpdate){
        sql +=", updated = 1";
        el_nav._done = false;
        DATAS.push(el_nav);

        sql += " WHERE code_chantier = ?";
        args.push(el_sql.code_chantier);

        bdd.query(sql, args, function (error, results, fields) {
            if (error) throw error;

            const p = (e) => e.No == el_sql.code_chantier;

            DATAS[DATAS.findIndex(p)]._done = true;

            console.log("Chantier " + el_nav.Description + " (" + el_sql.code_chantier + ") mis à jour");
        });
    }
}

function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done == false) {
                allGood = false;
            }
        });


        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'nav_chantiers'",
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