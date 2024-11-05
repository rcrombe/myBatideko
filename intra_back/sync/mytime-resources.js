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
            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
        }
        else {

            var tokenData = JSON.parse(response.body);
            var TOKEN_TYPE = tokenData.token_type;
            var TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            // récupération des données de resources dans mySQL
            bdd.query('SELECT * FROM resources WHERE Actif=1 AND resources.type="SALARIE" ' +
                'AND (resources.Activite="3.05-POSEUR" OR resources.Activite="3.10-CHEF-EQ" ' +
                'OR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" ' +
                'OR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND" OR resources.Activite="3.50-ATELIER")' +
                'ORDER BY Nom ASC',
                function (error, resultsMySql, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                    } else {

                        var options = {
                            url: 'https://apiold.mytime.fr/v2/employees/',
                            headers: {
                                'Authorization': TOKEN_TYPE + ' ' + TOKEN
                            },
                        }
                        request.get(options, function (error, resultsMyTime, body) {
                                if (error) {
                                    log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                } else {
                                    var datasMyTime = JSON.parse(resultsMyTime.body);
                                    var options2 = {
                                        url: 'https://apiold.mytime.fr/v2/employees/?status=ARCHIVE',
                                        headers: {
                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN
                                        },
                                    }
                                    request.get(options2, function (error, resultsMyTimeArchive, body) {
                                        if (error) {
                                            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                        } else {
                                            var datasMyTimeArchive = JSON.parse(resultsMyTimeArchive.body);

                                            // Désarchivage
                                            for(let el of datasMyTimeArchive) {

                                                var indexEmployeeArchive = resultsMySql.map(function(e) {
                                                    return e.id_mytime; }).indexOf(el.id);

                                                //resources déjà enregistrées dans MyTime (archivé ou non )
                                                if(indexEmployeeArchive!==-1) {

                                                    //désarchiver la resource
                                                    var options = {
                                                        url: 'https://apiold.mytime.fr/v2/employees/'+el.id+'/enable',
                                                        headers: {
                                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                        }
                                                    }

                                                    request.patch(options, function (error, result, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                        } else {
                                                            console.log('Désarchivage',result.body);
                                                        }
                                                    })

                                                }
                                            }

                                            // Insertion des données employés dans MyTime
                                            for(let el of resultsMySql) {

                                                var indexEmployee = datasMyTime.map(function(e) {
                                                    return e.id; }).indexOf(el.id_mytime);
                                                var isArchive = datasMyTimeArchive.map(function(e) {
                                                    return e.id; }).indexOf(el.id_mytime);

                                                //resources jamais enregistrées dans MyTime
                                                if(indexEmployee===-1 && isArchive===-1) {

                                                    let body = {
                                                        'first_name': el.Nom.normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
                                                        'last_name': 'CUPPENS',
                                                        'ref_perso': el.matricule_resource,
                                                        'email': el.Nom.normalize('NFD').replace(
                                                            /[\u0300-\u036f]/g, "").replaceAll(' ','_')+ '@cuppens.fr'
                                                    };
                                                    var b = body;

                                                    body = querystring.stringify(body);

                                                    var options = {
                                                        url: 'https://apiold.mytime.fr/v2/employees/',
                                                        headers: {
                                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                            'Content-Type': 'application/x-www-form-urlencoded'
                                                        },
                                                        body: body
                                                    }

                                                    request.post(options, function (error, resultPost, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Resources',null)
                                                        }
                                                        else {
                                                            var datasMyTime = JSON.parse(resultPost.body);
                                                            console.log('création', b);
                                                            console.log('création', resultPost.body);
                                                            if(datasMyTime.id != null){
                                                                bdd.query('UPDATE resources SET id_mytime=?, code_pointage=?,' +
                                                                    'password_mytime=? WHERE matricule_resource = ?',
                                                                    [datasMyTime.id, datasMyTime.code_pointage, datasMyTime.password
                                                                        , el.matricule_resource],
                                                                    function (error, resultsMySql, fields) {
                                                                        if (error) {
                                                                            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                                        } else {

                                                                            let body = {
                                                                                /*'company_cloking_how_associate' : 'BY_CODE',
                                                                                'company_clocking_check': 'NONE',*/
                                                                                'work_location': '128 chemin des postes, 59120 Loos'
                                                                            };

                                                                            body = querystring.stringify(body);

                                                                            var options = {
                                                                                url: 'https://apiold.mytime.fr/v2/employees/' + datasMyTime.id,
                                                                                headers: {
                                                                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                                                },
                                                                                body : body
                                                                            };

                                                                            console.log(options);

                                                                            request.patch(options, function (error, resultPost, body) {
                                                                                if (error) {
                                                                                    log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                                                } else {
                                                                                    console.log(resultPost.body);
                                                                                }
                                                                            });
                                                                        }
                                                                        ;
                                                                    })
                                                            }

                                                        }

                                                    });
                                                }
                                            }

                                            //Archivage
                                            for(let el of datasMyTime){
                                                var indexEmployee = resultsMySql.map(function(e) {
                                                    return e.id_mytime; }).indexOf(el.id);


                                                if(indexEmployee===-1){

                                                    var options = {
                                                        url: 'https://apiold.mytime.fr/v2/employees/'+el.id+'/disable',
                                                        headers: {
                                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                        }
                                                    }

                                                    request.patch(options, function (error, result, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                        } else {
                                                            console.log('Archivage',result.body)
                                                        }
                                                    })

                                                }
                                            }

                                        }
                                    })
                                }
                            })
                    }
                })
        }
        console.log('la synchro des resources avec mytyime est operationelle ');
        log("Synchronisation des resources ", 'Resources', null);
});

setTimeout(function(){

    bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_ressources'",
        function (error, result, fields) {
            bdd.end(() => {
                console.log("Arrêt de la connexion");
                process.exit(0);
            });
        });

    }, 1000*60);