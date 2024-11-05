/*process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;*/
const request = require('request');
const fs = require('fs');
const mysql = require('mysql');
const querystring = require('querystring');
const moment = require('moment');

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

var g_count = 0;
var g_StartedCount = 0;

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
//Récupération du token
request.post(options,
    function(error, response,body) {
        if (error) {
            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
        } else {

            var tokenData = JSON.parse(response.body);
            let TOKEN_TYPE = "Bearer";
            let TOKEN = tokenData.token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            let startDateWeek = moment(new Date()).isoWeekday('Monday').format('YYYY-MM-DD');
            let endDateWeek = moment(new Date()).isoWeekday('Sunday').format('YYYY-MM-DD');

            bdd.query("SELECT * FROM mytime_pointages where mytime_pointages.id_mytime not in (select distinct (pointages.id_mytime) from pointages, resources where resources.Actif = 1 and resources.id_mytime is not null and resources.id_mytime = pointages.id_mytime_resource and pointages.id_mytime is not null)",
                function (error, toRemove, fields) {
                if (error) {
                    log("Erreur _SELECT : " + error, 'Synchro Pointages', null);
                } else {
                    bdd.query('SELECT * FROM pointages',
                        function (error, pointages_sql, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Synchro Pointages', null);
                            } else {
                                let body = {
                                    'start_date' : startDateWeek,
                                    'end_date' : endDateWeek
                                };

                                body =  querystring.stringify(body);

                                var options = {
                                    //url: 'https://apiold.mytime.fr/v2/clockings/list-by-employee?'+body,
                                    //url: 'https://api.mytime.fr/clock-event?'+body,
                                    url: 'https://api.mytime.fr/listing/list-employee-by-employee?'+body,
                                    headers: {
                                        'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                        'Content-Type': 'application/json'
                                    }
                                }
                                console.log(options);

                                request(options, function(error, pointagesMyTime, body){
                                    if(error)
                                        console.log(error)
                                    else {
                                        console.log("Requested");
                                        console.log(pointagesMyTime.body);

                                        var pointages = JSON.parse(pointagesMyTime.body);

                                        var increment = 0;

                                        var nb_pointage_chantier = 0;
                                        var nb_pointage_pause = 0;
                                        var nb_pointage_trajet = 0;

                                        //console.log(pointages.by_event)

                                        for(let el of pointages.by_event) {
                                            setTimeout(
                                                function () {
                                                    increment++;
                                                    //console.log("Looping n° " + increment + "/ " + pointages.clockings.length);
                                                    if(el.event_type == 'CLOCKING')
                                                        el.action_id = el.clock_event.action_id;
                                                    else if (el.event_type == 'TRIP_AUTO_FROM_STARTING_POINT_EMPLOYEE_TO_WORK')
                                                        el.action_id = 'ALLER';
                                                    else if (el.event_type == 'TRIP_AUTO_FROM_WORK_TO_STARTING_POINT_EMPLOYEE')
                                                        el.action_id = 'RETOUR';
                                                    else if (el.event_type == 'AUTO_BREAK_DURATION')
                                                        el.action_id = 'BREAK';


                                                    if ((el.action_id == 'DEBUT' || el.action_id == 'FIN') && el.company_id != null && el.company_id != '') {
                                                        //console.log(el);
                                                        nb_pointage_chantier++;

                                                        if (pointages_sql.length == 0 || !exists(pointages_sql, el.clock_event)) {

                                                            var req = '(date, heure,id_mytime,id_mytime_resource, ' +
                                                                'id_mytime_chantier,etat,anomalie,date_time,action,msg,adresse) VALUES (CAST(FROM_UNIXTIME(?) as date),CAST(FROM_UNIXTIME(?) as time),?,?,?,?,?,?,?,?,?)'
                                                            var args = [];
                                                            args.push(el.clock_event.timestamp);
                                                            args.push(el.clock_event.timestamp);
                                                            args.push(el.clock_event.id);
                                                            args.push(el.clock_event.employee_id);
                                                            args.push(el.clock_event.company_id);
                                                            args.push('NIVEAU1');

                                                            args.push((el.clock_event.result_id != 'OK' ? el.clock_event.result_id : null));

                                                            args.push(el.clock_event.timestamp);
                                                            args.push(el.clock_event.action_id);
                                                            args.push(el.clock_event.entered_message);
                                                            if(el.clock_event.real_location_formatted_address != null)
                                                                args.push(el.clock_event.real_location_formatted_address);
                                                            else if(el.clock_event.real_location_coordinates != null)
                                                                args.push(el.clock_event.real_location_coordinates);
                                                            else if(el.clock_event.location_formatted_address)
                                                                args.push(el.clock_event.location_formatted_address);
                                                            else if(el.clock_event.location_coordinates)
                                                                args.push(el.clock_event.location_coordinates);

                                                            args.push(el.clock_event.id);

                                                            var z = args;

                                                            z.id = el.clock_event.id;
                                                            z._done_mytime = true;
                                                            z._done_mysql = false;
                                                            z._id = increment;
                                                            DATAS.push(z);

                                                            //console.log(req, args)

                                                            g_StartedCount++;

                                                            bdd.query('INSERT INTO pointages ' + req + ' ; INSERT INTO mytime_pointages (id_mytime) VALUES (?)', args, function (error, results, fields) {

                                                                const p = (e) => e.id == el.clock_event.id;

                                                                g_count++;

                                                                DATAS[DATAS.findIndex(p)]._done_mysql = true;

                                                                console.log("Request sent (chantier), idx " + DATAS[DATAS.findIndex(p)]._id + " | " + g_count + " / " + g_StartedCount);

                                                                if (error) {
                                                                    log("Erreur : " + error, 'Synchro Pointages', null);
                                                                } else {
                                                                    console.log("Pointage ajouté : " + JSON.stringify(z));
                                                                    console.log("Pointage ajouté _ source : " + JSON.stringify(el));
                                                                }
                                                            });
                                                        }

                                                    } else if (el.action_id == 'ALLER' || el.action_id == 'RETOUR') {
                                                        if (pointages_sql.length == 0 || !exists_trajet(pointages_sql, el)) {

                                                            nb_pointage_trajet++;

                                                            var idx = get_sqlIdx_noChantier(pointages_sql, el);

                                                            var req = '(date, heure,id_mytime,id_mytime_resource, ' +
                                                                'id_mytime_chantier,etat,anomalie,date_time,action,duree) VALUES (CAST(FROM_UNIXTIME(?) as date),CAST(FROM_UNIXTIME(?) as time),?,?,?,?,?,?,?,?)'
                                                            var args = [];
                                                            //Delete Args
                                                            args.push(el.timestamp);
                                                            args.push(el.employee_id);
                                                            args.push(el.action_id);

                                                            //Insert Args
                                                            args.push(el.timestamp);
                                                            args.push(el.timestamp);
                                                            args.push(el.id);
                                                            args.push(el.employee_id);
                                                            args.push(null);

                                                            if(idx != -1)
                                                                args.push(pointages_sql[idx].etat);
                                                            else
                                                                args.push('NIVEAU1');

                                                            args.push(null);
                                                            args.push(el.timestamp);
                                                            args.push(el.action_id);
                                                            args.push(el.duration_real);

                                                            var z = args;

                                                            z.id = el.employee_id;
                                                            z.id_duree = el.duration_real;
                                                            z.id_action = el.action_id;
                                                            z.id_timestamp = el.timestamp;
                                                            z._done_mytime = true;
                                                            z._done_mysql = false;
                                                            z._id = increment;
                                                            DATAS.push(z);

                                                            //console.log(req, args)
                                                            g_StartedCount++;

                                                            bdd.query('DELETE FROM pointages WHERE date = CAST(FROM_UNIXTIME(?) as date) AND id_mytime_resource = ? AND action = ? ; ' +
                                                                'INSERT INTO pointages ' + req, args, function (error, results, fields) {
                                                                const p = (e) => e.id == el.employee_id && e.id_duree == el.duration_real && e.id_action == el.action_id && e.id_timestamp == el.timestamp;

                                                                g_count++;

                                                                DATAS[DATAS.findIndex(p)]._done_mysql = true;

                                                                console.log("Request sent (trajet), idx " + DATAS[DATAS.findIndex(p)]._id + " | " + g_count + " / " + g_StartedCount);

                                                                //console.log(results);

                                                                if (error) {
                                                                    log("Erreur : " + error, 'Synchro Pointages', null);
                                                                }
                                                            });
                                                        }
                                                    } else if (el.action_id == 'BREAK') {

                                                        nb_pointage_pause++;
                                                        //console.log(el);
                                                        if (pointages_sql.length == 0 || !exists_break(pointages_sql, el)) {

                                                            var idx = get_sqlIdx_noChantier(pointages_sql, el);

                                                            var req = '(date, heure,id_mytime,id_mytime_resource, ' +
                                                                'id_mytime_chantier,etat,anomalie,date_time,action,duree) VALUES (CAST(FROM_UNIXTIME(?) as date),CAST(FROM_UNIXTIME(?) as time),?,?,?,?,?,?,?,?)'
                                                            var args = [];
                                                            //Delete Args
                                                            args.push(el.timestamp);
                                                            args.push(el.employee_id);
                                                            args.push(el.action_id);
                                                            args.push(el.duration);

                                                            //Insert Args
                                                            args.push(el.timestamp);
                                                            args.push(el.timestamp);
                                                            args.push(el.id);
                                                            args.push(el.employee_id);
                                                            args.push(null);
                                                            if(idx != -1)
                                                                args.push(pointages_sql[idx].etat);
                                                            else
                                                                args.push('NIVEAU1');
                                                            args.push(null);
                                                            args.push(el.timestamp);
                                                            args.push(el.action_id);
                                                            args.push(el.duration);

                                                            var z = args;

                                                            z.id = el.employee_id;
                                                            z.id_duree = el.duration;
                                                            z.id_action = el.action_id;
                                                            z.id_timestamp = el.timestamp;
                                                            z._done_mytime = true;
                                                            z._done_mysql = false;
                                                            z._id = increment;
                                                            DATAS.push(z);

                                                            //console.log(req, args)
                                                            g_StartedCount++;
                                                            bdd.query('DELETE FROM pointages WHERE date = CAST(FROM_UNIXTIME(?) as date) AND id_mytime_resource = ? AND action = ? AND duree = ? ; ' +
                                                                'INSERT INTO pointages ' + req, args, function (error, results, fields) {

                                                                    const p = (e) => e.id == el.employee_id && e.id_duree == el.duration && e.id_action == el.action_id && e.id_timestamp == el.timestamp;

                                                                g_count++;

                                                                DATAS[DATAS.findIndex(p)]._done_mysql = true;

                                                                console.log("Request sent (break), idx " + DATAS[DATAS.findIndex(p)]._id + " | " + g_count + " / " + g_StartedCount);

                                                                    if (error) {
                                                                        log("Erreur : " + error, 'Synchro Pointages', null);
                                                                    }
                                                                }
                                                            );
                                                        } 
                                                    }
                                                    //}
                                                },
                                                increment * 50
                                            )
                                        }

                                        setTimeout(
                                            function (){
                                                console.log("Nombre de pointages chantier : " + nb_pointage_chantier);
                                                console.log("Nombre de pointages trajet : " + nb_pointage_trajet);
                                                console.log("Nombre de pointages pause : " + nb_pointage_pause);

                                                var total = nb_pointage_pause+nb_pointage_trajet+nb_pointage_chantier;
                                                console.log("Nombre de pointages total : " + total);
                                                //console.log(JSON.stringify(pointages));
                                                started = true;
                                            },
                                            increment * 50 + 50
                                        )
                                    }
                                })
                            }
                        });

                }
            });
        }
    });

function get_sqlIdx(arr, val){
    var pred = (e) => e.date_time == val.timestamp && e.id_mytime_resource == val.employee_id && e.id_mytime_chantier == val.company_id;

    return arr.findIndex(pred);
}
function get_sqlIdx_noChantier(arr, val){
    var pred = (e) => e.date_time == val.timestamp && e.id_mytime_resource == val.employee_id && e.id_mytime_chantier != null;

    return arr.findIndex(pred);
}
function exists(arr, val){
    for(let e of arr) {
        if (e.date_time == val.timestamp && e.id_mytime_resource == val.employee_id && e.id_mytime_chantier == val.company_id)
            return true;
    }
    return false;
}
function exists_trajet(arr, val){
    var date_now = new Date(val.timestamp*1000);
    var date_today = date_now.getFullYear() + '-' +
        ("0" + (date_now.getMonth() + 1)).slice(-2) + '-' +
        ("0" + date_now.getDate()).slice(-2);

    for(let e of arr) {

        var t_date = new Date(e.date);
        var t_date_today = t_date.getFullYear() + '-' +
            ("0" + (t_date.getMonth() + 1)).slice(-2) + '-' +
            ("0" + t_date.getDate()).slice(-2);

        if (t_date_today == date_today && e.id_mytime_resource == val.employee_id && e.duree == val.duration_real && e.action == val.action_id)
            return true;
    }
    return false;
}
function exists_break(arr, val){

    var date_now = new Date(val.timestamp*1000);
    var date_today = date_now.getFullYear() + '-' +
        ("0" + (date_now.getMonth() + 1)).slice(-2) + '-' +
        ("0" + date_now.getDate()).slice(-2);

    for(let e of arr) {
        var t_date = new Date(e.date);
        var t_date_today = t_date.getFullYear() + '-' +
            ("0" + (t_date.getMonth() + 1)).slice(-2) + '-' +
            ("0" + t_date.getDate()).slice(-2);

        if (t_date_today == date_today && e.id_mytime_resource == val.employee_id && e.duree == val.duration)
            return true;
    }
    return false;
}
function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done_mytime == false || el._done_mysql == false) {
                //console.log(el)
                allGood = false;
            }
        });

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'mytime_pointages'",
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
