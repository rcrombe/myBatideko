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

var data = fs.readFileSync('../config.json', 'utf8');

var CONF = JSON.parse(data);

console.log("[Authentication] Authentication token retrieved and stored");

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});


request.get('https://api-preprod.mytime.fr/v2/oauth/get-token?email=jcalcoen@cuppens.fr&password=Jo@CAL2021',
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
        } else {

            var tokenData = JSON.parse(response.body);
            var TOKEN_TYPE = tokenData.token_type;
            var TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            var i =0;
            bdd.query('SELECT DISTINCT(id_mytime) FROM conges_mytime ',
                function (error, absencesMySql, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime : " + error, 'Planning Resources', null);
                    } else {
                        var length = absencesMySql.length;
                        console.log(length)
                        absencesMySql.forEach((abs)=>{
                            var options = {
                                url: 'https://api-preprod.mytime.fr/v2/days_off/'+abs.id_mytime,
                                headers: {
                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                            }
                            request.delete(options, function (error, absDelete, body) {
                                if (error) {
                                    log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
                                } else {
                                    i++
                                    console.log('delete success')
                                    if(i===length){
                                        var options = {
                                            url: 'https://api-preprod.mytime.fr/v2/employees/',
                                            headers: {
                                                'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                'Content-Type': 'application/x-www-form-urlencoded'
                                            },
                                        }

                                        request.get(options, function (error, resultsEmployeesMyTime, body) {
                                            if (error) {
                                                log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
                                            } else {
                                                var employeesMyTime = JSON.parse(resultsEmployeesMyTime.body);
                                                for(let el of employeesMyTime){
                                                    bdd.query('SELECT * FROM `assignations_absence` ' +
                                                        'INNER JOIN resources ON resources.matricule_resource = assignations_absence.matricule_resource ' +
                                                        'INNER JOIN semaines ON semaines.id=assignations_absence.id_semaine ' +
                                                        'WHERE (NOW() BETWEEN date_start AND date_end OR NOW()<date_end) AND Actif=1 ' +
                                                        'AND resources.type="SALARIE" AND resources.id_mytime=? ' +
                                                        'AND (resources.Activite="3.05-POSEUR" OR resources.Activite="3.10-CHEF-EQ" ' +
                                                        'OR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" ' +
                                                        'OR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND") ' +
                                                        'ORDER BY id_semaine ASC, jour ASC', [el.id],
                                                        function (error, absencesMySql, fields) {
                                                            if (error) {
                                                                log("Erreur synchronisation MyTime : " + error , 'Resources', null);
                                                            } else {
                                                                var dates = [];
                                                                for (let dayOff of absencesMySql) {
                                                                    //Définition du jour de congé
                                                                    var date = new Date(dayOff.date_start);
                                                                    date.setDate(date.getDate() + dayOff.jour);
                                                                    var dateString = date.getFullYear() + '-' +
                                                                        ("0" + (date.getMonth() + 1)).slice(-2) + '-' +
                                                                        ("0" + date.getDate()).slice(-2);

                                                                    // Vérification si il s'agit d'une période de congé ou juste un jour
                                                                    var dateAvant = new Date(date);
                                                                    dateAvant.setDate(dateAvant.getDate() - 1);
                                                                    var dateAvantString = dateAvant.getFullYear() + '-' +
                                                                        ("0" + (dateAvant.getMonth() + 1)).slice(-2) + '-' +
                                                                        ("0" + dateAvant.getDate()).slice(-2);

                                                                    var verifPeriod = dates.map(function (e) {
                                                                        return e.date_end;
                                                                    }).indexOf(dateAvantString);

                                                                    if (verifPeriod !== -1 && dayOff.journee === 0) {
                                                                        if (dates[verifPeriod].period_type === 'MORNING'
                                                                            || dates[verifPeriod].period_type === 'AFTERNOON') {
                                                                            dates.push({
                                                                                'employee_id': el.id,
                                                                                'date_start': dateString,
                                                                                'date_end': dateString,
                                                                                'period_type': (dayOff.journee === 1 ? 'MORNING' : (dayOff.journee === 2 ? 'AFTERNOON' : "SINGLE"))
                                                                            })
                                                                        } else {
                                                                            dates[verifPeriod].date_end = dateString;
                                                                            dates[verifPeriod].period_type = "MULTIPLE";
                                                                        }
                                                                    } else {
                                                                        dates.push({
                                                                            'employee_id': el.id,
                                                                            'date_start': dateString,
                                                                            'date_end': dateString,
                                                                            'period_type': (dayOff.journee === 1 ? 'MORNING' : (dayOff.journee === 2 ? 'AFTERNOON' : "SINGLE"))
                                                                        })
                                                                    }
                                                                }
                                                                if(dates.length!==0) {
                                                                    for(let date of dates) {

                                                                        body = querystring.stringify(date);

                                                                        var options = {
                                                                            url: 'https://api-preprod.mytime.fr/v2/days_off/',
                                                                            headers: {
                                                                                'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                                                'Content-Type': 'application/x-www-form-urlencoded'
                                                                            },
                                                                            body : body,
                                                                        };

                                                                        request.post(options, function (error, resultsMyTimeDaysOff, body) {
                                                                            var resultsDaysOff = JSON.parse(resultsMyTimeDaysOff.body);
                                                                            if (error)
                                                                                log("Erreur synchronisation MyTime : " + error, 'Planning Absences', null);
                                                                            else if(resultsDaysOff[0]) {
                                                                                log("Erreur synchronisation MyTime : " + options.body +
                                                                                    resultsDaysOff[0].error_description, 'Synchro Planning Absences', null);
                                                                                console.log(resultsDaysOff[0].error_description);
                                                                                console.log(options)
                                                                            }
                                                                            else {

                                                                                var dateDayOff = new Date(date.date_start);
                                                                                while(dateDayOff <= new Date(date.date_end)){

                                                                                    dateDayOffString= dateDayOff.getFullYear() + '-' +
                                                                                        ("0" + (dateDayOff.getMonth() + 1)).slice(-2) + '-' +
                                                                                        ("0" + dateDayOff.getDate()).slice(-2);

                                                                                    bdd.query('UPDATE assignations_absence ' +
                                                                                        'INNER JOIN semaines ON ' +
                                                                                        'semaines.id= assignations_absence.id_semaine ' +
                                                                                        'INNER JOIN resources ON ' +
                                                                                        'resources.matricule_resource=assignations_absence.matricule_resource ' +
                                                                                        'SET assignations_absence.id_mytime = ? ' +
                                                                                        'WHERE resources.id_mytime= ? AND ' +
                                                                                        'DATE_ADD(date_start, INTERVAL jour DAY)= ?;' +
                                                                                        'INSERT INTO conges_mytime (id_mytime) VALUES (?)',
                                                                                        [resultsDaysOff.id,el.id,dateDayOffString,resultsDaysOff.id],
                                                                                        function (error, absencesMySql, fields) {
                                                                                            if (error) {
                                                                                                log("Erreur synchronisation MyTime : " + error, 'Resources', null);
                                                                                            } else {
                                                                                                console.log('creation absence');
                                                                                            }
                                                                                        });

                                                                                    dateDayOff = new Date(dateDayOff.setDate(dateDayOff.getDate()+1))
                                                                                }

                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        })
                                                }
                                            }
                                        })
                                    }
                                }
                            });
                        })


                    }
                });
        }
    });

setTimeout(function(){
    bdd.end(function(err) {
        if (err) {
            return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
    });}, 1000*60);
