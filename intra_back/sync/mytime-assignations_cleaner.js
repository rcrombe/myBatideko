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
            //console.log('Log success')
        });
}

//Connection à mySQL

var started = false;
var DATAS = [];

var RES_AFF = [];

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

var tokenData;
var TOKEN_TYPE;
var TOKEN;

var asked = [];

var requests_count = 0;

var DATAS_job = [];
var dataLoading = false;
var dataLoaded = false;

//Récupération du token
request.get('https://apiold.mytime.fr/v2/oauth/get-token?email=alenoire@cuppens.fr&password=RDA2R3w5triQzjB',
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
        } else {

            tokenData = JSON.parse(response.body);
            TOKEN_TYPE = tokenData.token_type;
            TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            bdd.query('SELECT DISTINCT R.id_mytime as id_resource, C.id_mytime as id_chantier ' +
                'FROM resources R ' +
                'INNER JOIN assignations A ON R.matricule_resource = A.matricule_resource ' +
                'INNER JOIN chantiers C ON A.code_chantier = C.code_chantier ' +
                'INNER JOIN semaines S ON A.id_semaine = S.id ' +
                'WHERE R.Actif=1 AND R.type="SALARIE" ' +
                'AND (R.Activite="3.05-POSEUR" OR R.Activite="3.10-CHEF-EQ" ' +
                'OR R.Activite="3.01-APPRENTI" OR R.Activite="3.15-CHEF-CH" ' +
                'OR R.Activite="1.03-PLATRERIE" OR R.Activite="1.05-PLAFOND" OR R.Activite="3.50-ATELIER") ' +
                'AND R.id_mytime IS NOT NULL ' +
                'AND C.id_mytime IS NOT NULL ' +
                'AND NOW() BETWEEN S.date_start AND S.date_end',
                function(error, ressources, fields){
                    ressources.forEach((ass) => {
                        const p = (e) => e == ass.id_resource;
                        var idx_res = asked.findIndex(p);

                        if (idx_res == -1) {
                            ass._done = false;
                            DATAS_job.push(ass);
                        }
                    });

                    ressources.forEach((ass) => {
                        const p = (e) => e == ass.id_resource;
                        var idx_res = asked.findIndex(p);

                        const p_re = (e) => e.id_resource == ass.id_resource && e.id_chantier == ass.id_chantier;
                        ressources[ressources.findIndex(p_re)]._exists = false;

                        if(idx_res == -1){
                            let params_assignations = {
                                'status': 'ACTIF',
                                'employee_id': ass.id_resource,
                                'assigned': 1
                            };

                            params_assignations = querystring.stringify(params_assignations);

                            var options_assignations = {
                                url: 'https://apiold.mytime.fr/v2/companies/?' + params_assignations,
                                headers: {
                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN
                                }
                            };

                            //https://apiold.mytime.fr/v2/companies/?&status=ACTIF&employee_id=R7cx57h1ty49ZSodG8ab&assigned=1
                            request.get(options_assignations, function (error, assignation, params_assignations) {
                                var predicate = (e) => e.id_resource == ass.id_resource && e.id_chantier == ass.id_chantier;
                                DATAS_job[DATAS_job.findIndex(predicate)]._done = true;

                                if (error) {
                                    log("Erreur synchronisation MyTime _ ASSIGNATIONS CLEANER : " + error, 'Planning Chantiers', null)
                                } else {
                                    var hasCC000000 = false;

                                    var answer = JSON.parse(assignation.body);
                                    var chantiers_toRemove = [];

                                    answer.forEach((el) =>{
                                        const predicate = (e) => e.id_chantier == el.id && e.id_resource == ass.id_resource;
                                        var idx = ressources.findIndex(predicate);

                                        if(el.id == 'ohKaqSHmQ29c63fT8tKr')
                                            hasCC000000 = true;

                                        if(idx < 0){
                                            let body2 = {
                                                'employee_id': ass.id_resource,
                                                'company_id': el.id,
                                                'send_notification_to_employee': 0
                                            };

                                            body2 = querystring.stringify(body2);


                                            //affectation du chantier à l'employe
                                            var options = {
                                                url: 'https://apiold.mytime.fr/v2/employee_company_assignments/0/remove/',
                                                headers: {
                                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                },
                                                body: body2
                                            };

                                            request.post(options, function (error, assignation, body2) {
                                                requests_count++;
                                                if (error) {
                                                    log("Erreur synchronisation MyTime : " + error, 'Planning Chantiers', null)
                                                } else {
                                                    const p_datas = (e) => e.id_resource == ass.id_resource && e.id_chantier == ass.id_chantier;
                                                    DATAS_job[DATAS_job.findIndex(p_datas)]._done = true;

                                                    console.log('Response : ', assignation.body)
                                                }
                                            });

                                        } else {
                                            ressources[idx]._exists = true;

                                            console.log("On keep : " + el.id + " pour : " + ass.id_resource);
                                        }
                                    });

                                    if(!hasCC000000){
                                        var array_p = {};
                                        array_p.id_resource = ass.id_resource
                                        array_p.id_chantier = 'ohKaqSHmQ29c63fT8tKr';
                                        array_p._done = false;

                                        DATAS_job.push(array_p);


                                        let body2 = {
                                            'employee_id': array_p.id_resource,
                                            'company_id': array_p.id_chantier,
                                            'send_notification_to_employee': 0
                                        };

                                        body2 = querystring.stringify(body2);


                                        //affectation du chantier à l'employe
                                        var options = {
                                            url: 'https://apiold.mytime.fr/v2/employee_company_assignments/0/add-companies-to-employee/',
                                            headers: {
                                                'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                'Content-Type': 'application/x-www-form-urlencoded'
                                            },
                                            body: body2
                                        };

                                        request.post(options, function (error, assignation, body2) {
                                            requests_count++;
                                            if (error) {
                                                log("Erreur synchronisation MyTime : " + error, 'Planning Chantiers', null)
                                            } else {
                                                const p_datas_actualisation = (e) => e.id_resource == array_p.id_resource && e.id_chantier == array_p.id_chantier;
                                                DATAS_job[DATAS_job.findIndex(p_datas_actualisation)]._done = true;
                                                console.log('Response : ', assignation.body)
                                            }
                                        });
                                    }

                                    ressources.forEach((element) => {
                                        if(element.id_resource == ass.id_resource){
                                            if(!element._exists){
                                                let body2 = {
                                                    'employee_id': element.id_resource,
                                                    'company_id': element.id_chantier,
                                                    'send_notification_to_employee': 0
                                                };

                                                body2 = querystring.stringify(body2);


                                                //affectation du chantier à l'employe
                                                var options = {
                                                    url: 'https://apiold.mytime.fr/v2/employee_company_assignments/0/add-companies-to-employee/',
                                                    headers: {
                                                        'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                        'Content-Type': 'application/x-www-form-urlencoded'
                                                    },
                                                    body: body2
                                                };

                                                request.post(options, function (error, assignation, body2) {
                                                    requests_count++;
                                                    if (error) {
                                                        log("Erreur synchronisation MyTime : " + error, 'Planning Chantiers', null)
                                                    } else {
                                                        const p_datas_actualisation = (e) => e.id_resource == element.id_resource && e.id_chantier == element.id_chantier;
                                                        DATAS_job[DATAS_job.findIndex(p_datas_actualisation)]._done = true;
                                                        console.log('Response : ', assignation.body)
                                                    }
                                                });
                                            }
                                            else {
                                                const p_datas_actualisation = (e) => e.id_resource == element.id_resource && e.id_chantier == element.id_chantier;

                                                DATAS_job[DATAS_job.findIndex(p_datas_actualisation)]._done = true;
                                            }
                                        }
                                        started = true;
                                    });
                                }

                                /*
                                Si pas de CC000000
                                if (idx === -1) {
                                let body2 = {
                                    'employee_id': ass.resource_id,
                                    'company_ids': ass.chantier_id,
                                    'send_notification_to_employee': 0
                                };

                                body2 = querystring.stringify(body2);


                                //affectation du chantier à l'employe
                                var options = {
                                    url: 'https://apiold.mytime.fr/v2/employee_company_assignments/0/add-companies-to-employee/',
                                    headers: {
                                        'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    },
                                    body: body2
                                };

                                request.post(options, function (error, assignation, body2) {
                                    if (error) {
                                        log("Erreur synchronisation MyTime : " + error, 'Planning Chantiers', null)
                                    } else {
                                        console.log('Response : ', assignation.body)
                                    }
                                });
                            }
                                 */
                            });


                            asked.push(ass.id_resource);
                        }
                    });
                });

        }
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
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_assignations_cleaner'",
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
