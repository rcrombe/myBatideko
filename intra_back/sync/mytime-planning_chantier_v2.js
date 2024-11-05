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

var requests_count = 0;

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

var DATAS_job = [];
var dataLoaded = false;

//Récupération du token
request.get('https://apiold.mytime.fr/v2/oauth/get-token?email=alenoire@cuppens.fr&password=RDA2R3w5triQzjB',
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime _ Getting Toekn : " + error, 'Resources', null);
        } else {

            tokenData = JSON.parse(response.body);
            TOKEN_TYPE = tokenData.token_type;
            TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);
            bdd.query('SELECT * FROM mytime_planning WHERE mytime_planning.id_mytime NOT IN (SELECT DISTINCT(assignations.id_mytime) FROM assignations, resources WHERE resources.Actif = 1 AND resources.id_mytime IS NOT NULL AND resources.matricule_resource = assignations.matricule_resource AND assignations.id_mytime IS NOT NULL)',
                function (error, toRemove, fields) {
                    if (error) {
                        log("Erreur synchronisation MyTime _ SQL: " + error, 'Planning Resources', null);
                    } else {
                        toRemove.forEach((el) => {
                            el._done_mysql = false;
                            el._done_mytime = false;
                            DATAS.push(el);

                            var options = {
                                url: 'https://apiold.mytime.fr/v2/schedules/'+el.id_mytime,
                                headers: {
                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                            }
                            request.delete(options, function (error, absDelete, body) {
                                requests_count++;
                                const p = (e) => e.id_mytime == el.id_mytime;

                                DATAS[DATAS.findIndex(p)]._done_mytime = true;

                                if (error) {
                                    log("Erreur synchronisation MyTime _ DELETE : " + error, 'Planning Chantiers', null);
                                } else{
                                    console.log("Requête de suppression envoyée");

                                }
                            });

                            bdd.query('DELETE FROM mytime_planning WHERE id_mytime = ?', el.id_mytime,
                                function (error, toRemove, fields) {

                                    const p = (e) => e.id_mytime == el.id_mytime;
                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                    if (error) {
                                        log("Erreur synchronisation MyTime _ DELETE : " + error, 'Planning Chantiers', null);
                                    } else {
                                    }
                                });
                        });
                    }
                });


        }
    });

function doMyJob(){
    dataLoaded = true;
    DATAS_job.forEach((el) => {
        if(el._done == false) {
            dataLoaded = false;
        }
    });

    if(dataLoaded){
        clearInterval(timer_job);

        bdd.query('SELECT assignations.id_mytime, journee, date_start,jour,chantiers.id_mytime AS chantier_id, resources.id_mytime AS resource_id' +
            ',assignations.id_assignation FROM assignations INNER JOIN semaines ON semaines.id = assignations.id_semaine ' +
            'INNER JOIN resources ON resources.matricule_resource = assignations.matricule_resource ' +
            'INNER JOIN chantiers ON chantiers.code_chantier=assignations.code_chantier ' +
            'WHERE (NOW()<date_end OR NOW()=date_end)  ' +
            ' AND resources.Actif=1 AND resources.type="SALARIE" AND resources.id_mytime IS NOT NULL ' + //AND resources.matricule_resource = "000448"
            'AND (resources.Activite="3.05-POSEUR" OR resources.Activite="3.10-CHEF-EQ" ' +
            'OR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" ' +
            'OR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND"  OR resources.Activite="3.50-ATELIER") ' +
            'ORDER BY Nom ASC',
            function (error, chantiersMySql, fields) {
                if (error) {
                    log("Erreur synchronisation MyTime _ Sync_ Planning : " + error, 'Planning Chantiers', null);
                } else {

                    var assSendList = []

                    var SYNC_DATA = {
                        data: null
                    };

                    var TMP_DATA = [];

                    for (let ass of chantiersMySql) {
                        var date = new Date(ass.date_start);
                        date.setDate(date.getDate() + ass.jour);
                        var dateString = date.getFullYear() + '-' +
                            ("0" + (date.getMonth() + 1)).slice(-2) + '-' +
                            ("0" + date.getDate()).slice(-2);

                        let x = countObj(chantiersMySql, ass.journee, ass.jour, ass.date_start, ass.resource_id);
                        if (x == 1) {
                            /*OLD SYNC VERSION
                            var body = {
                                'employee_id': ass.resource_id,
                                'date': dateString,
                                'company_id': ass.chantier_id,
                                'journee': ass.journee,
                            };*/

                            var start_time = dateString + ' ' + ((ass.journee == 0 || ass.journee == 1) ? '07:00:00' : '12:45:00');
                            var end_time = dateString + ' ' + ((ass.journee == 0 || ass.journee == 2) && ass.jour != 4 ? '15:45:00' :
                                ((ass.journee == 0 || ass.journee == 2) && ass.jour == 4 ? '15:30:00' : '11:00:00'));

                            var body = {
                                'employee': ass.resource_id,
                                'company': ass.chantier_id,
                                'start_date_time': start_time,
                                'end_date_time': end_time,
                                'registration_number': ass.id_assignation
                            }

                            //body = querystring.stringify(body);

                        } else {
                            /*OLD SYNC VERSION
                            var body = {
                                'employee_id': ass.resource_id,
                                'date': dateString,
                                'company_id': ass.chantier_id,
                                'journee': ass.journee
                            };
                            */
                            var res = createTime(assSendList, ass.journee, dateString, ass.resource_id);

                            var start_time = dateString + ' ' + res[0];
                            var end_time = dateString + ' ' + res[1];

                            var body = {
                                'employee': ass.resource_id,
                                'company': ass.chantier_id,
                                'start_date_time': start_time,
                                'end_date_time': end_time,
                                'registration_number': ass.id_assignation
                            }

                            //body = querystring.stringify(body);
                        }

                        assSendList.push(body);

                        ass._done_mytime = false;
                        ass._done_mysql = false;
                        ass.body = body;
                        DATAS.push(ass);
                        const p = (e) => e.id_assignation == ass.id_assignation;

                        if (ass.id_mytime == null) {
                            //PUSH la data dans l'array pour synchro
                            TMP_DATA.push(body);

                        } else {
                            DATAS[DATAS.findIndex(p)]._done_mytime = true;
                            DATAS[DATAS.findIndex(p)]._done_mysql = true;
                        }
                    }

                    SYNC_DATA.data = JSON.stringify(TMP_DATA);

                    var options = {
                        url: 'https://api-preprod.mytime.fr/v2/schedules/0/synchronize',
                        headers: {
                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: querystring.stringify(SYNC_DATA)
                    }

                    console.log(options)

                    request.post(options, function (error, resultPost, body) {
                        requests_count++;

                        for(var el of TMP_DATA){
                            const p = (e) => e.id_assignation == el.registration_number;
                            DATAS[DATAS.findIndex(p)]._done_mytime = true;
                        }

                        if (error) {
                            log("Erreur synchronisation MyTime _ Post Assignation MyTime : " + error, 'Planning Chantiers', null)
                        } else {
                            //console.log(resultPost)

                            console.log("LOG : " + resultPost.body)
                            var resultPostParse = null;

                            try{
                                resultPostParse = JSON.parse(resultPost.body)
                            }
                            catch (e){

                                console.log(resultPost)


                                console.log("Receivend invalid body : " + resultPost.body);
                            }

                            if(resultPostParse != null && typeof resultPostParse.schedules != 'undefined' && resultPostParse.schedules != null){

                                for(let sc of resultPostParse.schedules){
                                    console.log(sc);
                                }

                                /*bdd.query('UPDATE assignations SET id_mytime = ? WHERE id_assignation= ?; INSERT INTO mytime_planning (id_mytime) VALUES (?) ',
                                    [resultPostParse.id, ass.id_assignation, resultPostParse.id],
                                    function (error, rien, fields) {
                                        DATAS[DATAS.findIndex(p)]._done_mysql = true;

                                        if (error) {
                                            log("Erreur synchronisation MyTime - INSERTION : " + error, 'Planning Chantiers', null);
                                            console.log(resultPostParse);
                                        } else {


                                            console.log('création', resultPost.body)
                                        }
                                    });*/
                            }
                            else{
                                console.log("BIG ELSE")

                                for(var el of TMP_DATA){
                                    const p = (e) => e.id_assignation == el.registration_number;
                                    DATAS[DATAS.findIndex(p)]._done_mysql = true;
                                }
                            }


                            //console.log('Response_ Body : ', resultPost.body)
                            //console.log('Response_ BodyRep : ', ass)

                        }
                    })

                    started = true;
                }
            })
    }
}

var timer_job = setInterval(doMyJob, 5000);

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
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_planning_chantiers'",
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

var timer = setInterval(checkAlive, 15000);

function createTime(list , journee, date, resource_id){
    if(journee ==0 ||journee == 1) {
        var res = ['07:05:00', '08:05:00'];
        var i =0;
        for(let el of list) {
            let obj = querystring.parse(el);
            if (obj.employee_id == resource_id && obj.date== date && obj.journee == journee) {
                res = [obj.start_time, obj.end_time]
            }
        };
        var date_start = new Date('2021/01/01 '+res[0]);
        var date_end = new Date('2021/01/01 '+res[1]);
        date_start.setHours(date_start.getHours() +2)
        date_end.setHours(date_end.getHours() +2)
        res[0] = (date_start.toISOString()).substr(11,8);
        res[1] = (date_end.toISOString()).substr(11,8);
        return res;
    }
    else{
        var res = ['12:45:00', '13:45:00'];
        var i =0;
        for(let obj of list) {
            if (obj.employee_id == resource_id && obj.date== date && obj.journee == journee) {
                res = [obj.start_time, obj.end_time]
            }
        };
        var date_start = new Date('2021/01/01 '+res[0]);
        var date_end = new Date('2021/01/01 '+res[1]);
        date_start.setHours(date_start.getHours()-2)
        date_end.setHours(date_end.getHours() -2)
        res[0] = (date_start.toISOString()).substr(11,8);
        res[1] = (date_end.toISOString()).substr(11,8);
        return res;
    }
}

function countObj(list, journee, jour, date_start, resource_id){
    var res = 0;
    for(let obj of list){
        if(obj.jour == jour && obj.date_start.getTime() == date_start.getTime() && obj.resource_id == resource_id && obj.journee == journee)
            res ++;
    };
    return res;
}

