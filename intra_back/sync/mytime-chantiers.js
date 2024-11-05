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
var requests_count = 0;
var started = false;
var DATAS = [];

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
                'WHERE (code_chantier LIKE "CC%" OR code_chantier LIKE "CA%" OR  ' +
                'code_chantier = "_ATELIER" or code_chantier = "_BUREAUX" or code_chantier = "_TRAVAUX EPI" or code_chantier = "_MEDECINE" or code_chantier = "_CHARGEMENT" or code_chantier = "_REUNION" or code_chantier = "CPAM CAMBRAI" or code_chantier = "CPAM MAUBEUGE" or code_chantier = "CPAM VALENCIENNES" ) ' +
                'ORDER BY  Actif DESC, chantiers.code_chantier ASC',
                function (error, resultsMySql, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                    } else {

                        var options = {
                            url: 'https://apiold.mytime.fr/v2/companies/',
                            headers: {
                                'Authorization': TOKEN_TYPE + ' ' + TOKEN
                            },
                        }
                        request.get(options, function (error, resultsMyTime, body) {
                            if (error) {
                                log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                            } else {
                                var datasMyTime = JSON.parse(resultsMyTime.body);

                                var options2 = {
                                    url: 'https://apiold.mytime.fr/v2/companies/?status=ARCHIVE',
                                    headers: {
                                        'Authorization': TOKEN_TYPE + ' ' + TOKEN
                                    },
                                }
                                request.get(options2, function (error, resultsMyTimeArchive, body) {
                                    if (error) {
                                        log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                                    } else {

                                        /*var datasMyTimeArchive = JSON.parse(resultsMyTimeArchive.body);

                                        // Désarchivage
                                        for(let el of datasMyTimeArchive) {

                                            var indexCompanieArchive = resultsMySql.map(function(e) {
                                                return e.id_mytime; }).indexOf(el.id);

                                            //resources déjà enregistrées dans MyTime (archivé ou non )
                                            if(indexCompanieArchive!==-1) {
                                                if(resultsMySql[indexCompanieArchive].Actif===1) {
                                                    el.code_chantier = resultsMySql[indexCompanieArchive].code_chantier;
                                                    el._done_mytime = false;
                                                    el._done_mysql = true;
                                                    DATAS.push(el);

                                                    //désarchiver la resource
                                                    var options = {
                                                        url: 'https://apiold.mytime.fr/v2/companies/' + el.id + '/enable',
                                                        headers: {
                                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                        }
                                                    }

                                                    request.patch(options, function (error, result, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                        } else {
                                                            console.log('Désarchivage', result.body);
                                                        }

                                                        const p = (e) => e.code_chantier == el.code_chantier;

                                                        DATAS[DATAS.findIndex(p)]._done_mytime = true;
                                                    })
                                                }

                                            }
                                        }*/

                                        // Insertion des données chantiers dans MyTime
                                        for(let el of resultsMySql) {

                                            var indexCompanie = datasMyTime.map(function(e) {
                                                return e.id; }).indexOf(el.id_mytime);
                                            /*var isArchive = datasMyTimeArchive.map(function(e) {
                                                return e.id; }).indexOf(el.id_mytime);*/

                                            //resources jamais enregistrées dans MyTime
                                            if(indexCompanie===-1 && el.id_mytime == null) {

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
                                                    url: 'https://apiold.mytime.fr/v2/companies/',
                                                    headers: {
                                                        'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                        'Content-Type': 'application/x-www-form-urlencoded'
                                                    },
                                                    body: body
                                                }

                                                console.log(options)

                                                request.post(options, function (error, resultPost, body) {
                                                    requests_count++;
                                                    const p = (e) => e.code_chantier == el.code_chantier;

                                                    DATAS[DATAS.findIndex(p)]._done_mytime = true;

                                                    if (error) {
                                                        log("Erreur synchronisation MyTime : " + error, 'Resources',null)
                                                        DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                                    }
                                                    else {
                                                        DATAS[DATAS.findIndex(p)]._done_mysql = false;

                                                        var datasMyTime = JSON.parse(resultPost.body);

                                                        bdd.query('UPDATE chantiers SET id_mytime=?, code_pointage=?,' +
                                                            'password_mytime=? WHERE code_chantier = ?',
                                                            [datasMyTime.id, datasMyTime.code_pointage, datasMyTime.password
                                                                ,el.code_chantier],
                                                            function (error, resultsMySql, fields) {
                                                                if (error) {
                                                                    log("Erreur synchronisation MyTime : " + error, 'Resources',null);
                                                                } else {
                                                                    console.log('création', el.code_chantier, resultPost.body)

                                                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                                                }
                                                            });
                                                        if(el.Actif==0){
                                                            DATAS[DATAS.findIndex(p)]._done_mytime = false;

                                                            var options = {
                                                                url: 'https://apiold.mytime.fr/v2/companies/'+datasMyTime.id+'/disable',
                                                                headers: {'Authorization': TOKEN_TYPE + ' ' + TOKEN,}
                                                            }

                                                            request.patch(options, function (error, result, body) {
                                                                requests_count++;
                                                                DATAS[DATAS.findIndex(p)]._done_mytime = true;
                                                                if (error) {
                                                                    log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                                } else {
                                                                    console.log('Archivage après creation',result.body)
                                                                }
                                                            })
                                                        }
                                                    }

                                                });
                                            }
                                        }

                                        //Archivage
                                        for(let el of datasMyTime){
                                            var indexCompanie = resultsMySql.map(function(e) {
                                                return e.id_mytime; }).indexOf(el.id);


                                            if(indexCompanie===-1 ||
                                                (indexCompanie!==-1 && resultsMySql[indexCompanie].Actif==0)){

                                                el.code_chantier = el.ref_perso;
                                                el._done_mytime = false;
                                                el._done_mysql = true;
                                                DATAS.push(el);

                                                var options = {
                                                    url: 'https://apiold.mytime.fr/v2/companies/'+el.id+'/disable',
                                                    headers: {'Authorization': TOKEN_TYPE + ' ' + TOKEN,}
                                                }

                                                request.patch(options, function (error, result, body) {
                                                    requests_count++;
                                                    if (error) {
                                                        log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                    } else {
                                                        console.log('Archivage ' +  result.body)

                                                    }
                                                    const p = (e) => e.code_chantier == el.code_chantier;

                                                    DATAS[DATAS.findIndex(p)]._done_mytime = true;
                                                })

                                            } else {
                                                //check des infos chantier
                                            }
                                        }


                                        started = true;
                                    }
                                })
                            }
                        })

                    }
                })

            


        }
        log("Synchronisation des chantiers ", 'Chantiers', null);
    });


function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done_mytime == false || el._done_mysql == false) {
                allGood = false;
            }
        });

        console.log("Requests count : " + requests_count);

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_chantiers'",
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