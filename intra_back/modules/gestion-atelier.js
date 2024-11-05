module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate){
    const loglevel = printLogLevel();

//semaine actuelle id et numéro
    app.get('/api/gestion_codes_atelier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_CODES_ATELIER', token)) {
                    bdd.query('SELECT PAA.*, count(PAL.code_action) as nbUsed FROM pointages_atelier_actions PAA\n' +
                        'LEFT JOIN pointages_atelier_lignes PAL ON PAL.code_action = PAA.id\n' +
                        'GROUP BY PAL.code_action, PAA.id, PAA.nom_action, PAA.nav_action ' +
                        'ORDER BY PAA.id DESC',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Codes Atelier', user.id)
                                res.json(false)
                            }
                            else {
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.post('/api/gestion_codes_atelier/new', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CODES_ATELIER', token)) {
                    if(typeof req.body.nom_action != 'undefined' && req.body.nom_action.length > 0){
                        var name = req.body.nom_action;
                        var nav_action = req.body.nav_action;

                        bdd.query('INSERT INTO pointages_atelier_actions (nom_action, nav_action) VALUES (?,?) ', [name,nav_action], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Codes Atelier', user.id)
                                res.json(false)
                            }
                            else{
                                res.json(true);
                            }
                        });
                    }
                    else{
                        res.json(false);

                    }
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    app.put('/api/gestion_codes_atelier/edit', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CODES_ATELIER', token)) {
                    if(req.body.nom_action.length > 0){
                        var id = req.body.id;
                        var name = req.body.nom_action;
                        var nav_action = req.body.nav_action;

                        if(name != ''){
                            bdd.query('UPDATE pointages_atelier_actions SET nom_action = ?, nav_action = ? WHERE id = ? ', [name,nav_action,id], function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Gestion Codes Atelier', user.id)
                                    res.json(false)
                                }
                                else{
                                    res.json(true);
                                }
                            });
                        }
                        else
                            res.json(false);
                    }
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    //suppression d'un module
    app.delete('/api/gestion_codes_atelier/remove/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Codes Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CODES_ATELIER', token)) {
                    bdd.query("DELETE FROM pointages_atelier_actions WHERE id = ?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Codes Atelier', user.id);
                            res.json(false);
                        } else {
                            log("Suppression du code " + req.params.id, 'Gestion Codes Atelier', user.id);
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
