process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const request = require('request');
const fs = require('fs');
const mysql = require('mysql');
const querystring = require('querystring');


while(1 != 2){
    request.get('http://my.cuppens.fr',
        function(error, response,body) {
            if (error) {
                console.log("Erreur synchronisation MyTime : ", error);
            } else {

                console.log(body);
            }
        });
}

