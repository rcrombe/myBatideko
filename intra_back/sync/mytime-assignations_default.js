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

var requests_count = 0;
var asked = [];

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

            bdd.query('SELECT R.matricule_resource, id_mytime as id_resource ' +
                'FROM resources R ' +
                'WHERE id_mytime IS NOT NULL',
                function(error, ressources, fields){

                    ressources.forEach((ass) => {
                        const p = (e) => e == ass.id_resource;
                        var idx_res = asked.findIndex(p);

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
                            if (error) {
                                log("Erreur synchronisation MyTime _ ASSIGNATIONS DEFAULTS : " + error, 'Planning Chantiers', null)
                            } else {
                                var hasCC000000 = false;

                                var answer = JSON.parse(assignation.body);
                                var chantiers_toRemove = [];

                                answer.forEach((el) =>{
                                    if(el.id == 'ohKaqSHmQ29c63fT8tKr')
                                        hasCC000000 = true;
                                });

                                if(!hasCC000000){
                                    var array_p = {};
                                    array_p.id_resource = ass.id_resource;
                                    array_p.id_chantier = "ohKaqSHmQ29c63fT8tKr";
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
                                            const p_datas_actualisation = (e) => e.id_resource == array_p.id_resource;
                                            DATAS_job[DATAS_job.findIndex(p_datas_actualisation)]._done = true;
                                            console.log('Response : ', assignation.body)
                                        }
                                    });
                                }
                            }
                        });
                    });


                    started = true;
                });

        }
    });

function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done == false) {
                allGood = false;
            }
        });

        console.log("Requests count : " + requests_count);

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_assignations_default'",
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

var timer = setInterval(checkAlive, 20000);
