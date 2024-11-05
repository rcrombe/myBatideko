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

var _MODULE = "M_POINTAGES_SAISIE";
var _MODULE_ICON = "fa-user-clock";

var DATAS = [];
var CTX = [];
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

bdd.query('SELECT C.Conducteur, COUNT(P.id) as nbPointages\n' +
    'FROM chantiers C, pointages P\n' +
    'WHERE P.id_mytime_chantier = C.id_mytime\n' +
    'AND P.etat = \'NIVEAU1\' AND P.action = \'FIN\'\n' +
    'AND C.Conducteur is not null\n' +
    'GROUP BY C.Conducteur',function (error, ctx_pointages, fields) {
    if (error) throw error;

    if (ctx_pointages.length == 0) {
        console.log("PAS DE DATA");
    } else {
        ctx_pointages.forEach((el) => {
            const p = (e) => e.nav_id == el.Conducteur;
            var idx = CTX.findIndex(p);

            if(idx != -1 && el.nbPointages > 0)
                notify("Il vous reste " + el.nbPointages + " pointage" + (el.nbPointages > 1 ? "s":"") + " à valider.", CTX[idx].id, CTX[idx].email, 'warning');
            else
                console.log('Aucun CTX identifié');
        });

        started = true;
    }
});

function notify(msg, userid, email, type){
    bdd.query('INSERT INTO alerts (user_id, module_id, date, type, icon, content) VALUES (?, ?, NOW(), ?, ?, ?)', [userid, _MODULE, type, _MODULE_ICON, msg],function (error, semaine, fields) {
        if (error) throw error;
    });

    sendMail(email, "Pointage non validés", "Bonjour, \n\n" + msg);
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

var timer = setInterval(checkAlive, 1000);