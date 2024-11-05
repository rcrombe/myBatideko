/*process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;*/
const request = require('request');
const fs = require('fs');
const mysql = require('mysql');
const querystring = require('querystring');

function log(msg,module,id_utilisateur){
    console.log("message : ",msg)
    console.log("module : ",module)
    console.log("utillsateur : ",id_utilisateur )
    var today = new Date(Date.now())
    var date = today.toLocaleString('sv-SE')
    bdd.query('INSERT INTO historique (id_utilisateur,date,description,module) ' +
        'VALUES (?,?,?,?)',[id_utilisateur,date, msg, module],
        function (error, results, fields) {
            if (error) throw error;
            console.log('Log success')
        });
}

//Connection à mySQL

var started = false;
var DATAS = [];

var data = fs.readFileSync('config.json', 'utf8');

var requests_count = 0;
var CONF = JSON.parse(data);

console.log("[Authentication] Authentication token retrieved and stored");

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});

//Récupération du token pour accès à MyTiME

request.get('https://apiold.mytime.fr/v2/oauth/get-token?email=alenoire@cuppens.fr&password=RDA2R3w5triQzjB',
    function(error, response,body){
        if(error){
            log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
        }
        else {

            var tokenData = JSON.parse(response.body);
            var TOKEN_TYPE = tokenData.token_type;
            var TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            // récupération des données des chantiers dans mySQL
            bdd.query('SELECT DISTINCT(chantiers.code_chantier), nom_chantier,code_postal,Ville,' +
                'chantiers.id_mytime, chantiers.Actif, chantiers.adresse, chantiers.adresse2 FROM chantiers ' +
                'WHERE (chantiers.code_chantier LIKE "CC%" OR chantiers.code_chantier LIKE "CA%" ' +
                'OR  chantiers.code_chantier LIKE "%ATELIER%" ) AND chantiers.code_chantier NOT LIKE "\\_%" AND chantiers.id_mytime IS NOT NULL AND Actif = 1 AND chantiers.updated = 1 ' +
                'ORDER BY  Actif DESC, chantiers.code_chantier ASC',
                function (error, resultsMySql, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                    } else {
                        resultsMySql.forEach((el,i) => {
                            setTimeout(
                                function(){
                                    el._done_mytime = false;
                                    DATAS.push(el);

                                    let body = {
                                        'company_type': "COMPANY",
                                        'company_name': el.code_chantier+" "+
                                            el.nom_chantier.normalize('NFD')
                                                .replaceAll(/[\u0300-\u036f]/g, "")
                                                .replaceAll(/[^a-zA-Z ]/g, " "),
                                        'ref_perso': el.code_chantier,
                                        'street' : el.adresse,
                                        'street2' : el.adresse2,
                                        'zip_code' :el.code_postal,
                                        'city' : el.Ville,
                                        'country' : 'FR',
                                    };

                                    body = querystring.stringify(body);

                                    var options = {
                                        url: 'https://apiold.mytime.fr/v2/companies/' + el.id_mytime,
                                        headers: {
                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        },
                                        body: body
                                    }

                                    request.patch(options, function (error, resultPost, body) {
                                        requests_count++;
                                        const p = (e) => e.code_chantier == el.code_chantier;

                                        DATAS[DATAS.findIndex(p)]._done_mytime = true;

                                        if (error) {
                                            log("Erreur synchronisation MyTime : " + error, 'Resources',null)
                                        }
                                        else {
                                            console.log("Result : " + resultPost.body)
                                        }

                                    });
                                }
                                , i*50
                            )

                        });
                        started = true;
                    }
                });
        }
        log("Synchronisation des chantiers ", 'Chantiers', null);
    });


function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done_mytime == false) {
                allGood = false;
            }
        });

        console.log("Requests count : " + requests_count);

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_chantiers_updater'",
                function (error, result, fields) {
                    bdd.end(() => {
                        console.log("Arrêt de la connexion");
                        process.exit(0);
                    });
                });
            clearInterval(timer);
        }
    }
}

var timer = setInterval(checkAlive, 2000);