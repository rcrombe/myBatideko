process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jsonWebToken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jsonParser = bodyParser.json();
const cors = require('cors');
// const request = require('request');
const axios = require('axios');
const sync_request = require('sync-request');
const fs = require('fs');
const multer = require('multer');
const { exec } = require('child_process');
const querystring = require('querystring');
const nodemailer = require('nodemailer');
const formData = require('form-data');

var data = fs.readFileSync('config.json', 'utf8');

var CONF = JSON.parse(data);

var loglevel = 4;
var semaines = []

var LOGGED_USERS = [];

// console.log(CONF);

console.log("[Authentication] Authentication token retrieved and stored");

var PERMISSIONS = [];

const app = express();
const webTokenKey = CONF.webTokenKey;

const SRV_PORT = CONF.port;

const bdd = mysql.createConnection({
    host: CONF.db_host,
    user: CONF.db_username,
    password: CONF.db_password,
    database: CONF.db_database,
    multipleStatements: true
});


const MYTIME_LOGS = {
    "email": CONF.mytime_user,
    "password": CONF.mytime_password
}

console.log("test");

var SECURITY = {
    loadSecurityCache: function () {
        console.log('Reading security cache');

        let rawdata = fs.readFileSync('.cache');
        let cacheData = JSON.parse(rawdata);

        LOGGED_USERS = cacheData;
    },
    saveSecurityCache: function () {
        console.log('Writing security cache');

        let data = JSON.stringify(LOGGED_USERS);
        fs.writeFileSync('.cache', data);
    },
    insertLoggedUser: function (usr) {
        const p = (e) => jsonWebToken.decode(e, webTokenKey).id == jsonWebToken.decode(usr, webTokenKey).id;

        //console.log(jsonWebToken.decode(token, webTokenKey));

        var idx = LOGGED_USERS.findIndex(p);

        if (idx != -1) {
            if (!SECURITY.isValidUser(LOGGED_USERS[idx]))
                LOGGED_USERS.splice(idx, 1);
        }

        LOGGED_USERS.push(usr);

        SECURITY.saveSecurityCache();
    },
    loadModulesPermissions: function () {
        bdd.query('SELECT DISTINCT G.id ' +
            'FROM groupes G ',
            function (error, groups, fields) {
                if (error) throw error;
                var callback = [];

                bdd.query('SELECT M.moduleName, M.moduleId, P.r, P.w, P.special, P.groupe_id FROM modules M, permissions P WHERE P.module_id = M.moduleId ',
                    function (error, results, fields) {
                        if (error) throw error;
                        groups.forEach((el) => {
                            var e = el;
                            e.permissions = [];

                            results.forEach((perm) => {
                                if (perm.groupe_id == el.id)
                                    e.permissions.push(perm);
                            });

                            callback.push(e);
                        });

                        PERMISSIONS = callback;
                        /*
                        console.log(SECURITY.canAccessRessource({id:null,role: 8}, 'special', 'A_ADMINISTRATION'));
                        //console.log(callback)*/
                    });

            });
    },
    canAccessRessource: function (usr, typeAccess, module, _token) {
        var idx = PERMISSIONS.findIndex((e) => e.id == usr.role);

        if (_token != null && !SECURITY.isValidUser(_token)) {
            console.log('CANNOT ACCESS : ' + module);
            return 0;
        }

        if (idx > -1) {
            //console.log("idx > -1")
            var idx_perm = PERMISSIONS[idx].permissions.findIndex((e) => e.moduleId == module);

            switch (typeAccess) {
                case 'r':
                    //console.log('CAN ACCESS : ' + module);
                    return PERMISSIONS[idx].permissions[idx_perm].r;
                    break;
                case 'w':
                    //console.log('CAN ACCESS : ' + module);
                    return PERMISSIONS[idx].permissions[idx_perm].w;
                    break;
                case 'special':
                    //console.log('CAN ACCESS : ' + module);
                    return PERMISSIONS[idx].permissions[idx_perm].special;
                    break;
                default:
                    //console.log('CANNOT ACCESS : ' + module);
                    return 0;
            }
        }
        else {
            saveLog("GROUP NOT FOUND : " + usr.role, "SECURITY", usr.id);
            return 0;
        }
    },
    isValidUser: function (token) {
        if (token && jsonWebToken.decode(token)) {
            if (LOGGED_USERS.findIndex((e) => e == token) == -1)
                return false;

            const exp = jsonWebToken.decode(token).exp;
            const now = new Date();

            return now.getTime() < (exp * 1000);
        }
        return false;
    }
}

var ALERTS = {
    create: function (alert) {
        console.log("Creating alert");
    }
}


function saveLog(msg, module, id_utilisateur) {
    console.log("message : ", msg)
    console.log("module : ", module)
    console.log("utillsateur : ", id_utilisateur)
    var today = new Date(Date.now())
    var date = today.toLocaleString('sv-SE')
    bdd.query('INSERT INTO historique (id_utilisateur,date,description,module) ' +
        'VALUES (?,?,?,?)', [id_utilisateur, date, msg, module],
        function (error, results, fields) {
            if (error) throw error;
            console.log('Log success')
        });
}

function getSemaines() {
    bdd.query('SELECT id, nb_semaine,date_start,date_end FROM semaines',
        function (error, results, fields) {
            if (error) throw error;
            semaines = JSON.parse(JSON.stringify(results));
        })
}

function synchroniserMyTime() {
    console.log('synchroniser');
    bdd.query('SELECT script_name FROM sync_modules',
        function (error, results, fields) {
            if (error)
                saveLog("Erreur synchronisation MyTime : " + error, 'Synchronisation automatique', null);
            else {
                for (let res of results) {
                    if (res.script_name != 'chantiers.js') {
                        exec('node ' + res.script_name, (error, stdout, stderr) => {
                            if (error) {
                                saveLog("Erreur synchronisation MyTime de " + res.script_name + " : " + error.message, 'Synchronisation automatique', null);
                            }
                            if (stderr) {
                                saveLog("Erreur synchronisation MyTime de " + res.script_name + " : " + stderr.message, 'Synchronisation automatique', null);
                            }
                            console.log('done : ', stdout);
                        });
                    }
                }
            };
        })
};

setInterval(getSemaines, 1000 * 60 * 60);


function printSemaines() {
    return semaines
}

getSemaines();
console.log("Semaines --> ", semaines)

function getNBsemaine(semaines, id_semaine) {
    var index = semaines.map(function (e) {
        return e.id;
    }).indexOf(Number(id_semaine))
    return semaines[index].nb_semaine
}

function getDate(semaines, id_semaine, jour) {
    var index = semaines.map(function (e) {
        return e.id;
    }).indexOf(Number(id_semaine))
    var date = new Date(semaines[index].date_start)
    date.setDate(date.getDate() + Number(jour))
    return date.toLocaleDateString()
}

// function getLogLevel() {
//     bdd.query('SELECT loglevel FROM parametres',
//         function (error, results, fields) {
//             if (error) throw error;
//             loglevel = results[0].loglevel;
//         })
// }

function setLogLevel(val) {
    loglevel = val;
}

function printLogLevel() {
    return loglevel
}

function getNavKey() {
    return CONF.nav_key;
}

function sendMail(to, subject, text) {

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

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function notify(titre, msg, userid, email, type, MODULE, MODULE_ICON) {
    bdd.query('INSERT INTO alerts (user_id, module_id, date, type, icon, content) VALUES (?, ?, NOW(), ?, ?, ?)', [userid, MODULE, type, MODULE_ICON, msg], function (error, semaine, fields) {
        if (error) throw error;
    });

    sendMail(email, "MyBatideko : " + titre, msg);
}

// getLogLevel();
// console.log("Log level --> " + loglevel);

SECURITY.loadSecurityCache();
SECURITY.loadModulesPermissions();

var corsOptions = {
    origin: 'https://my.batideko.fr',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(), bodyParser.json(), bodyParser.urlencoded({ extended: true }), function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");

    //res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next();

});
app.options('*', cors());
require('./modules/utilisateurs.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, saveLog, printLogLevel, printSemaines,
    getNBsemaine, getDate);
require('./modules/resources.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/planning.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate, sendMail);
require('./modules/planning-st.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/planning-atelier.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/vehicules.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/gestion-vehicules.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, getNBsemaine, getDate);
require('./modules/absences.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/rendezvous_chantier.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/home.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    printSemaines, getNBsemaine, getDate);
require('./modules/pointages.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, MYTIME_LOGS, formData);
require('./modules/gestion-pointages.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);
require('./modules/pointages-synthese.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);
require('./modules/historique-chantiers.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);
require('./modules/historique.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    setLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/gestion-administratif.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog, printLogLevel,
    setLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/gestion-synchro.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, setLogLevel, printSemaines, getNBsemaine, getDate, exec);
require('./modules/gestion-groupes.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, setLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/gestion-modules.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, setLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/gestion-alertes.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request, saveLog,
    printLogLevel, setLogLevel, printSemaines, getNBsemaine, getDate);
require('./modules/conducteurs.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, saveLog, printLogLevel, printSemaines,
    getNBsemaine, getDate);
require('./modules/alerts.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, saveLog, printLogLevel, printSemaines,
    getNBsemaine, getDate);
require('./modules/pointages-atelier.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring);
require('./modules/gestion-pointages-atelier.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);
require('./modules/gestion-atelier.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);
require('./modules/gestion-societes.js')(SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, axios, saveLog, printLogLevel,
    printSemaines, querystring, getNavKey);


app.listen(SRV_PORT, '127.0.0.1', function () {
    console.log('Server started on port ' + SRV_PORT);
    console.log('>>> Localhost only <<<');
})