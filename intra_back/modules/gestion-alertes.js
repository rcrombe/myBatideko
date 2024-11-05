module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate){
    const loglevel = printLogLevel();

    app.get('/api/gestion_alertes', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_ALERTES', token)) {
                    bdd.query('SELECT * FROM alerts_store',
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

    app.post('/api/gestion_alertes/new', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ALERTES', token)) {
                    if(req.body.nom.length > 0){

                        var id = req.body.id;
                        var name = req.body.nom;

                        bdd.query('INSERT INTO alerts_store (id, nom) VALUES (?,?) ', [id,name], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Alertes', user.id)
                                res.json(false)
                            }
                            else{
                                console.log(results);
                                var insertedId = results.insertId;

                                bdd.query('SELECT * from utilisateurs ', function (error, modules, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Gestion Alertes', user.id)
                                        res.json(false)
                                    }
                                    else{
                                        modules.forEach((el) => {
                                            bdd.query('INSERT INTO alerts_utilisateurs (user_id, alert_id) VALUES (?, ?) ', [el.id, id], function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Gestion Alertes', user.id)
                                                    res.json(false)
                                                } else {
                                                    console.log('Created : AID ' + id + ' for UID ' + el.id);
                                                }
                                            });
                                        });

                                        res.json(true);
                                    }
                                });
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
    app.delete('/api/gestion_alertes/remove/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Alertes', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ALERTES', token)) {
                    bdd.query("DELETE FROM alerts_store WHERE id=?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Alertes', user.id);
                            res.json(false);
                        } else {
                            log("Suppression de l'alerte " + req.params.id, 'Gestion Alertes', user.id);
                            res.json(results);
                        }
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });



    app.get('/api/gestion_alertes/users', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_USERS', token)) {
                    bdd.query('SELECT * FROM alerts_store',
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
