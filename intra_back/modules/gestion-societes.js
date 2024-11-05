module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate){
    const loglevel = printLogLevel();

    app.get('/api/gestion_societes', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_SOCIETES', token)) {
                    bdd.query('SELECT * FROM societes',
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

    app.post('/api/gestion_societes/new', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_SOCIETES', token)) {
                    if(req.body.nom.length > 0){

                        var name = req.body.nom;

                        bdd.query('INSERT INTO societes (nom) VALUES (?) ', [name], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Sociétés', user.id)
                                res.json(false)
                            }
                            else{
                                console.log(results);

                                res.json(true);
                            }
                        });
                    }
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    //suppression d'une alerte
    app.delete('/api/gestion_societes/remove/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Sociétés', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_SOCIETES', token)) {
                    bdd.query("DELETE FROM societes WHERE id=?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Sociétés', user.id);
                            res.json(false);
                        } else {
                            log("Suppression de la société " + req.params.id, 'Gestion Sociétés', user.id);
                            res.json(results);
                        }
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

}
