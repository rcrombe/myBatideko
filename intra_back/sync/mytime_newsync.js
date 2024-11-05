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
var requests_count = 0;
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


var fiche = {
    "email": CONF.mytime_user,
    "password": CONF.mytime_password
}

var body = JSON.stringify(fiche);

var options = {
    url: 'https://api.mytime.fr/login',
    headers: {
        'Content-Type': 'application/json'
    },
    body: body,
}

request.post(options,
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
        } else {

            var tokenData = JSON.parse(response.body);
            TOKEN_TYPE = "Bearer";
            TOKEN = tokenData.token;


            console.log("TOKEN RETRIEVED : " + TOKEN);


            bdd.query('SELECT * FROM mytime_conges WHERE mytime_conges.id_mytime NOT IN (SELECT DISTINCT(assignations_absence.id_mytime) FROM assignations_absence, resources WHERE resources.Actif = 1 AND resources.id_mytime IS NOT NULL AND resources.matricule_resource = assignations_absence.matricule_resource AND assignations_absence.id_mytime IS NOT NULL)',
                function (error, toRemove, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime : " + error, 'Planning Resources', null);
                    } else {
                        console.log(toRemove);
                        toRemove.forEach((el) => {
                            el._done_mysql = false;
                            el._done_mytime = false;
                            DATAS.push(el);


                            bdd.query('DELETE FROM mytime_conges WHERE id_mytime = ?', [el.id_mytime],
                                function (error, r, fields) {
                                    if (error) {
                                        log("Erreur synchronisation MyTime : " + error, 'Planning Resources', null);
                                    }

                                    const p = (e) => e.id_mytime == el.id_mytime;

                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                }
                            );

                        });

                    }
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
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_planning_abs'",
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

var timer = setInterval(checkAlive, 1000);