process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const request = require('sync-request');
const fs = require('fs');
const mysql = require('mysql');
const nodemailer = require('nodemailer');

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

bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'alert_rappel_pointage'",
    function (error, result, fields) {

    });

var _MODULE = "M_POINTAGES_CTRL";
var _MODULE_ICON = "fa-user-clock";

var DATAS = [];
var NOTIFIERS = [];
var started = false;


bdd.query('SELECT U.id, U.email FROM utilisateurs U, alerts_utilisateurs AU WHERE U.id = AU.user_id AND AU.enabled = 1 AND AU.alert_id = "ALERT_POINTAGES_SEMAINE"',function (error, utilisateurs, fields) {
    if (error) throw error;

    if(utilisateurs.length == 0){
        console.log("Aucune personne à notifier n'a été ajoutée");
    }
    else{
        NOTIFIERS = utilisateurs;
    }

});

bdd.query('SELECT id as id_semaine, nb_semaine FROM semaines WHERE date_end < NOW() AND pointages_valides = 0',function (error, SEMAINES, fields) {
    if (error) throw error;

    if (SEMAINES.length == 0) {
        console.log("PAS DE DATA");
        started = true;
    } else {
        SEMAINES.forEach((semaine) => {
            var t = semaine;
            t._done = false;
            DATAS.push(t);

            bdd.query('SELECT * FROM \n' +
                '(SELECT COUNT(P.id) as nb_n1 FROM pointages P, semaines S WHERE S.id = ? AND P.date BETWEEN S.date_start AND S.date_end AND P.etat = \'NIVEAU1\') AS n1,\n' +
                '(SELECT COUNT(P.id) as nb_n2 FROM pointages P, semaines S WHERE S.id = ? AND P.date BETWEEN S.date_start AND S.date_end AND P.etat = \'NIVEAU2\') AS n2,\n' +
                '(SELECT COUNT(P.id) as nb_valide FROM pointages P, semaines S WHERE S.id = ? AND P.date BETWEEN S.date_start AND S.date_end AND P.etat = \'VALIDE\') AS n3,\n' +
                '(SELECT COUNT(P.id) as nb_archive FROM pointages P, semaines S WHERE S.id = ? AND P.date BETWEEN S.date_start AND S.date_end AND P.etat = \'ARCHIVE\') AS n4',
                [semaine.id_semaine, semaine.id_semaine, semaine.id_semaine, semaine.id_semaine],
                function (error, pointages, fields){

                const p = (e) => e.id_semaine == semaine.id_semaine;
                DATAS[DATAS.findIndex(p)]._done = true;

                if (error) throw error;

                if (pointages.length == 0) {
                    console.log("PAS DE DATA");
                } else {

                    if(pointages[0].nb_n1 == 0 && (pointages[0].nb_n2 > 0 || pointages[0].nb_valide > 0 || pointages[0].nb_archive > 0)){
                        DATAS[DATAS.findIndex(p)]._done = false;

                        NOTIFIERS.forEach((el) => {
                            notify("La semaine " + semaine.nb_semaine + " a été entièrement validée.", el.id, el.email, 'success');
                        });

                        bdd.query('UPDATE semaines SET pointages_valides = 1 WHERE id = ?', [semaine.id_semaine], function(error, returned, fields){

                            if (error) throw error;

                            DATAS[DATAS.findIndex(p)]._done = true;
                            console.log("DONE LOL")
                        });

                        console.log(semaine.id_semaine)
                    }
                }
            });
        });


        started = true;
    }
});

function notify(msg, userid, email, type){
    bdd.query('INSERT INTO alerts (user_id, module_id, date, type, icon, content) VALUES (?, ?, NOW(), ?, ?, ?)', [userid, _MODULE, type, _MODULE_ICON, msg],function (error, semaine, fields) {
        if (error) throw error;
    });

    sendMail(email, "Semaine validée", "Bonjour, \n\n" + msg);
}

function sendMail(to, subject, text){

    var transporter = nodemailer.createTransport({
        host: "mail.cuppens.fr",
        port: 25,
        secure: false, // true for 465, false for other ports
        auth: {
            user: CONF.mail_user,
            pass: CONF.mail_password
        }
    });

    var mailOptions = {
        from: 'my@cuppens.fr',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function checkAlive(){
    if(started){
        var allGood = true;
        DATAS.forEach((el) => {
            if(el._done == false) {
                allGood = false;
            }
        });

        if(allGood) {
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'alert_rappel_pointage'",
                function (error, result, fields) {
                    bdd.end(() => {
                        console.log("Arrêt de la connexion");
                    });
                });
            clearInterval(timer);
        }
    }
}

var timer = setInterval(checkAlive, 2000);