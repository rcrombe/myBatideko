module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate, exec){
    const loglevel = printLogLevel();

//semaine actuelle id et numéro
    app.get('/api/gestion_synchro', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_SYNCHRO', token)) {
                    bdd.query('SELECT * FROM sync_modules',
                        function (error, results, fields) {
                            if (error) throw error;
                            res.json(results);
                        });
                }
            }
        });
    });

    app.post('/api/gestion_synchro/sync', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_SYNCHRO', token)) {
                    exec('node ' + req.body.script, (error, stdout, stderr) => {
                        if (error) {
                            console.log(error.message);
                            return;
                        }
                        if (stderr) {
                            console.log(stderr);
                            return;
                        }
                        if (stdout) {
                            console.log(stdout);

                        }
                    });
                    bdd.query('UPDATE sync_modules SET latest= NOW(), status = "En cours..." WHERE id=? ', [req.body.id], function (err, decode) {
                        if (err) {
                            res.send(false);
                        } else {
                            //logger ici
                            res.json('OK');
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    app.post('/api/gestion_synchro/toggle', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_SYNCHRO', token)) {
                    console.log("Toggling sync : " + req.body.id);

                    var id = req.body.id;
                    var status = req.body.status == 1 ? 1 : 0;

                    bdd.query('UPDATE sync_modules SET active = ? WHERE id = ?', [status, id],
                        function (error, results, fields) {
                            if (error) throw error;
                            res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

}
