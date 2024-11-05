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

bdd.query("UPDATE sync_modules SET status = 'En cours...' WHERE screen_name = 'alert_oubli_pointage'",
    function (error, result, fields) {

    });

var _MODULE = "M_POINTAGES_SAISIE";
var _MODULE_ICON = "fa-user-clock";

var DATAS = [];
var CTX = [];
var NOTIFIERS = [];
var started = false;


bdd.query('SELECT U.id, U.email, U.nav_id FROM utilisateurs U WHERE nav_id IS NOT NULL',function (error, conducteurs, fields) {
    if (error) throw error;

    if(conducteurs.length == 0){
        console.log("Aucun CTX n'a été trouvé");
    }
    else{
        CTX = conducteurs;
    }

});

bdd.query('SELECT U.id, U.email FROM utilisateurs U, alerts_utilisateurs AU WHERE U.id = AU.user_id AND AU.enabled = 1 AND AU.alert_id = "ALERT_POINTAGES_OUBLI"',function (error, utilisateurs, fields) {
    if (error) throw error;

    if(utilisateurs.length == 0){
        console.log("Aucune personne à notifier n'a été ajoutée");
    }
    else{
        NOTIFIERS = utilisateurs;
    }

});

bdd.query('SELECT S.* FROM semaines S WHERE S.date_start <= NOW() AND S.date_end > NOW()',function (error, semaine, fields) {
    if (error) throw error;

    if (semaine.length == 0) {
        console.log("PAS DE SEMAINE IDENTIFIEE");
    } else {
        var date_ini = new Date(semaine[0].date_start);
        var date = null;
        var date_now = new Date();
        var curr_day = -1;
        var date_today = date_now.getFullYear() + '-' +
            ("0" + (date_now.getMonth() + 1)).slice(-2) + '-' +
            ("0" + date_now.getDate()).slice(-2);

        for(var i = 0; i < 7; i++){
            date = new Date(date_ini.getTime());
            date.setDate(date.getDate() + i);

            if(date.getDate() == date_now.getDate()){
                curr_day = i;

                break;
            }
        }

        var id_semaine = semaine[0].id;

        bdd.query('SELECT R.matricule_resource, R.id_mytime, R.Nom, C.code_chantier, C.nom_chantier, C.Conducteur ' +
            'FROM assignations A, resources R, chantiers C ' +
            'WHERE A.code_chantier = C.code_chantier AND R.matricule_resource = A.matricule_resource ' +
            'AND A.id_semaine = ? AND A.jour = ? ' +
            'AND (A.journee = 0 OR A.journee = 1) ' +
            'AND R.id_mytime IS NOT NULL',[id_semaine,curr_day] ,function (error, assignations, fields) {
            if (error) throw error;

            if (assignations.length == 0) {
                console.log("Aucune planification n'a été réalisée cette semaine.")
            } else {
                console.log(assignations);
            }


            bdd.query('SELECT P.* FROM pointages P WHERE P.date = ?', [date_today],function (error, pointages, fields) {
                if (error) throw error;

                if (pointages.length == 0) {
                    console.log("PAS DE POINTAGES");
                }

                assignations.forEach((el) => {
                    var isOk = false;

                    pointages.forEach((pointage) => {
                        if(el.id_mytime == pointage.id_mytime_resource && pointage.action == 'DEBUT')
                            isOk = true;
                    });

                    if(!isOk){
                        const p = (e) => e.nav_id == el.Conducteur;
                        var idx = CTX.findIndex(p);

                        if(idx != -1){
                            notify("Le salarié " + el.Nom + " n'a pas pointé sur le chantier " + el.code_chantier + " " + el.nom_chantier, CTX[idx].id, CTX[idx].email, 'danger');

                            NOTIFIERS.forEach((el_notifier) => {
                                notify("Le salarié " + el.Nom + " n'a pas pointé sur le chantier " + el.code_chantier + " " + el.nom_chantier, el_notifier.id, el_notifier.email, 'danger');
                            });

                        }
                        else {
                            NOTIFIERS.forEach((el_notifier) => {
                                notify("Le salarié " + el.Nom + " n'a pas pointé sur le chantier " + el.code_chantier + " " + el.nom_chantier + " Aucun CTX renseigné sur le chantier", el_notifier.id, el_notifier.email, 'danger');
                            });
                        }
                    }
                });

                started = true;
            });
        });
    }
});

function notify(msg, userid, email, type){
    bdd.query('INSERT INTO alerts (user_id, module_id, date, type, icon, content) VALUES (?, ?, NOW(), ?, ?, ?)', [userid, _MODULE, type, _MODULE_ICON, msg],function (error, semaine, fields) {
        if (error) throw error;
    });

    sendMail(email, "Pointage non réalisé", "Bonjour, \n\n" + msg);
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
            bdd.query("UPDATE sync_modules SET status = 'Terminé' WHERE screen_name = 'alert_oubli_pointage'",
                function (error, result, fields) {
                    bdd.end(() => {
                        console.log("Arrêt de la connexion");
                    });
                });
            clearInterval(timer);
        }
    }
}

var timer = setInterval(checkAlive, 5000);