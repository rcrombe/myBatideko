module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate){
    const loglevel = printLogLevel();

//semaine actuelle id et numéro
    app.get('/api/gestion_modules', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_MODULES', token)) {
                    bdd.query('SELECT * FROM modules ',
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

    app.get('/api/gestion_modules/alerts', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_MODULES', token)) {
                    bdd.query('SELECT * FROM modules WHERE moduleId LIKE "ALERT\_%" ',
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

    app.post('/api/gestion_modules/new', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_MODULES', token)) {
                    if(req.body.nom.length > 0){
                        var id = req.body.id;
                        var name = req.body.nom;
                        var url = req.body.url;

                        bdd.query('INSERT INTO modules (moduleId, moduleName, moduleUrl) VALUES (?,?,?) ', [id,name,url], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Modules', user.id)
                                res.json(false)
                            }
                            else{
                                console.log(results);
                                var insertedId = results.insertId;

                                bdd.query('SELECT * from groupes ', function (error, modules, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Gestion Modules', user.id)
                                        res.json(false)
                                    }
                                    else{
                                        modules.forEach((el) => {
                                            bdd.query('INSERT INTO permissions (groupe_id, module_id) VALUES (?, ?) ', [el.id, id], function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Gestion Modules', user.id)
                                                    res.json(false)
                                                } else {
                                                    console.log('Created : MID ' + id + ' for GID ' + el.id);
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

    app.post('/api/gestion_modules/toggle', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_MODULES', token)) {

                    var id = req.body.id;
                    var status = req.body.status == 1 ? 0 : 1;

                    bdd.query('UPDATE modules SET enabled = ? WHERE moduleId = ?', [status, id],
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

    //suppression d'un modules
    app.delete('/api/gestion_modules/remove/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Modules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_MODULES', token)) {
                    bdd.query("DELETE FROM modules WHERE moduleId=?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Modules', user.id);
                            res.json(false);
                        } else {
                            log("Suppression du module " + req.params.id, 'Gestion Modules', user.id);
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
