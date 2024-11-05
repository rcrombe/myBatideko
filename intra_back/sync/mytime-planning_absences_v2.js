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


request.get('https://apiold.mytime.fr/v2/oauth/get-token?email=alenoire@cuppens.fr&password=RDA2R3w5triQzjB',
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
        } else {

            var tokenData = JSON.parse(response.body);
            var TOKEN_TYPE = tokenData.token_type;
            var TOKEN = tokenData.access_token;
//AzIEYlA1UmIAYVs7DDBSYQM_BWkPNlo6AGQCZwM8Xz1TYQ== 2860 000309
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
                            var options = {
                                url: 'https://apiold.mytime.fr/v2/days_off/'+el.id_mytime,
                                headers: {
                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                            }
                            request.delete(options, function (error, absDelete, body) {
                                requests_count++;
                                if (error) {
                                    log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
                                } else{
                                    console.log("Requête de suppression envoyée");

                                    const p = (e) => e.id_mytime == el.id_mytime;

                                    DATAS[DATAS.findIndex(p)]._done_mytime = true;
                                }
                            });

                        });
                        bdd.query('SELECT assignations_absence.*, semaines.*, resources.id_mytime as resource_id_mytime FROM `assignations_absence`' +
                            'INNER JOIN resources ON resources.matricule_resource = assignations_absence.matricule_resource ' +
                            'INNER JOIN semaines ON semaines.id=assignations_absence.id_semaine ' +
                            'WHERE (NOW() BETWEEN date_start AND date_end OR NOW()<date_end) AND Actif=1 ' +
                            'AND assignations_absence.id_mytime IS NULL ' +
                            'AND resources.type="SALARIE" AND resources.id_mytime IS NOT NULL ' +
                            'AND (resources.Activite="3.05-POSEUR" OR resources.Activite="3.10-CHEF-EQ" ' +
                            'OR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" ' +
                            'OR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND"  OR resources.Activite="3.50-ATELIER") ' +
                            //'AND resources.matricule_resource = \'000207\'' +
                            'ORDER BY id_semaine ASC, jour ASC',
                            function (error, absencesMySql, fields) {
                                if (error) {
                                    log("Erreur synchronisation MyTime : " + error , 'Resources', null);
                                } else {
                                    var dates = [];
                                    for (let dayOff of absencesMySql) {
                                        console.log(dayOff)
                                        //Définition du jour de congé
                                        var date = new Date(dayOff.date_start);
                                        date.setDate(date.getDate() + dayOff.jour);
                                        var dateString = date.getFullYear() + '-' +
                                            ("0" + (date.getMonth() + 1)).slice(-2) + '-' +
                                            ("0" + date.getDate()).slice(-2);

                                        var absType = 'PAID';

                                        if(dayOff.code_absence == 'ABSRECUP')
                                            absType = 'RECOVERY_TIME';
                                        else if(dayOff.code_absence == 'ABSMAL')
                                            absType = 'SICK_LEAVE';
                                        else if(dayOff.code_absence == 'ABSAT')
                                            absType = 'ACCIDENT_TRAVAIL';
                                        else if(dayOff.code_absence == 'ABSMP')
                                            absType = 'MALADIE_PROFESSIONNELLE';
                                        else if(dayOff.code_absence == 'ABSMATER')
                                            absType = 'MATERNITY';
                                        else if(dayOff.code_absence == 'ABSPATER')
                                            absType = 'PATERNITY';
                                        else if(dayOff.code_absence == 'ABSEVE')
                                            absType = 'FAMILY_EVENTS';
                                        else if(dayOff.code_absence == 'ABSENF')
                                            absType = 'SICK_CHILD';
                                        else if(dayOff.code_absence == 'ABSPAREN')
                                            absType = 'PARENTAL_ATTENDANCE_LEAVE';
                                        else if(dayOff.code_absence == 'GAR')
                                            absType = 'CHILD_CARE';
                                        else if(dayOff.code_absence == 'ABS')
                                            absType = 'ABSENCE_UNAUTHORIZED_UNPAID';
                                        else if(dayOff.code_absence == 'CPA')
                                            absType = 'PARTIAL_UNEMPLOYMENT';
                                        else if(dayOff.code_absence == 'CFA')
                                            absType = 'APPRENTISSAGE';
                                        else if(dayOff.code_absence == 'COVID')
                                            absType = 'ABSENCE_COVID19';

                                        if(dayOff.code_absence != 'FORM'){
                                            dates.push({
                                                'employee_id': dayOff.resource_id_mytime,
                                                'date_start': dateString,
                                                'date_end': dateString,
                                                'type': absType,
                                                'part_of_day': (dayOff.journee === 1 ? 'FULL' : (dayOff.journee === 2 ? 'AFTERNOON' : "FULL"))
                                            })
                                        }
                                    }
                                    if(dates.length!==0) {

                                        //console.log(dates);

                                        for(let date of dates) {

                                            body = querystring.stringify(date);

                                            var options = {
                                                url: 'https://apiold.mytime.fr/v2/days_off/',
                                                headers: {
                                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                },
                                                body : body,
                                            };

                                            //console.log("Sending : options");

                                            date._done_mysql = false;
                                            date._done_mytime = false;
                                            DATAS.push(date);

                                            request.post(options, function (error, resultsMyTimeDaysOff, body) {
                                                requests_count++;
                                                const p = (e) => (e.employee_id == date.employee_id && e.date_start == date.date_start);
                                                DATAS[DATAS.findIndex(p)]._done_mytime = true;

                                                console.log(error)

                                                if(typeof resultsMyTimeDaysOff != 'undefined' && resultsMyTimeDaysOff.body != null)
                                                    var resultsDaysOff = JSON.parse(resultsMyTimeDaysOff.body);

                                                if (error) {
                                                    log("Erreur synchronisation MyTime-post : " + error, 'Planning Absences', null);

                                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                                }
                                                else if(resultsDaysOff[0]) {
                                                    log("Erreur synchronisation MyTime-urlencodedresult0 : " +
                                                        resultsDaysOff[0].error_description, 'Synchro Planning Absences', null);
                                                    console.log(DATAS[DATAS.findIndex(p)])
                                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                                }
                                                else {


                                                    var dateDayOff = new Date(date.date_start);
                                                    while(dateDayOff <= new Date(date.date_end)){

                                                        dateDayOffString= dateDayOff.getFullYear() + '-' +
                                                            ("0" + (dateDayOff.getMonth() + 1)).slice(-2) + '-' +
                                                            ("0" + dateDayOff.getDate()).slice(-2);

                                                        log("Ajout d'absences pour " + date.employee_id + " : " + dateDayOffString, 'Planning Absences', null);

                                                        bdd.query('UPDATE assignations_absence ' +
                                                            'INNER JOIN semaines ON ' +
                                                            'semaines.id= assignations_absence.id_semaine ' +
                                                            'INNER JOIN resources ON ' +
                                                            'resources.matricule_resource=assignations_absence.matricule_resource ' +
                                                            'SET assignations_absence.id_mytime = ? ' +
                                                            'WHERE resources.id_mytime= ? AND ' +
                                                            'DATE_ADD(date_start, INTERVAL jour DAY)= ?;' +
                                                            'INSERT INTO mytime_conges (id_mytime) VALUES (?)',
                                                            [resultsDaysOff.id,date.employee_id,dateDayOffString,resultsDaysOff.id],
                                                            function (error, absencesMySql, fields) {
                                                                if (error) {
                                                                    log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                                } else {

                                                                    const z = (e) => (e.employee_id == date.employee_id && e.date_start == date.date_start);

                                                                    DATAS[DATAS.findIndex(z)]._done_mysql = true;
                                                                    //console.log("absencesMySql");
                                                                }
                                                            });

                                                        dateDayOff = new Date(dateDayOff.setDate(dateDayOff.getDate()+1))
                                                    }

                                                }
                                            });

                                        }
                                    }
                                    started = true;
                                }
                            })
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