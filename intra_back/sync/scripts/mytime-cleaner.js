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
            log("Erreur synchronisation MyTime : " + error, 'Resources', null);
        } else {

            var tokenData = JSON.parse(response.body);
            var TOKEN_TYPE = tokenData.token_type;
            var TOKEN = tokenData.access_token;

            console.log("TOKEN RETRIEVED : " + TOKEN);

            var options = {
                url: 'https://api-preprod.mytime.fr/v2/companies/',
                headers: {
                    'Authorization': TOKEN_TYPE + ' ' + TOKEN
                },
            }

            request.get(options, function(error, response2,body) {
                var companies = JSON.parse(response2.body);



                for(let el of companies){
                    var options = {
                        url: 'https://api-preprod.mytime.fr/v2/companies/'+el.id,
                        headers: {
                            'Authorization': TOKEN_TYPE + ' ' + TOKEN
                        },
                    }
                    request.delete(options,function(error, response2,body) {
                        console.log('delete');
                    });
                }
                })

            var options = {
                url: 'https://api-preprod.mytime.fr/v2/companies/?status=ARCHIVE',
                headers: {
                    'Authorization': TOKEN_TYPE + ' ' + TOKEN
                },
            }

            request.get(options, function(error, response2,body) {
                var companies = JSON.parse(response2.body);



                for(let el of companies){
                    var options = {
                        url: 'https://api-preprod.mytime.fr/v2/companies/'+el.id,
                        headers: {
                            'Authorization': TOKEN_TYPE + ' ' + TOKEN
                        },
                    }
                    request.delete(options,function(error, response2,body) {
                        console.log('delete');
                    });
                }
            })
        }
    });