module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt,log, printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

    app.get('/api/conducteurs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Conducteurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_CTX', token) || SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {

                    bdd.query('SELECT C.*, U.nom, U.prenom, U.redirection_nav_id, U.electricien FROM conducteurs C, utilisateurs U WHERE U.nav_id = C.initiales',
                        function (error, results_conducteurs, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                res.json(false)
                            } else {
                                for (var i = 0; i < results_conducteurs.length; i++) {
                                    if (results_conducteurs[i].redirection_nav_id != null) {
                                        const p = (e) => e.initiales == results_conducteurs[i].redirection_nav_id;
                                        var idx = results_conducteurs.findIndex(p);

                                        results_conducteurs[i].redirection_prenom = results_conducteurs[idx].prenom;
                                        results_conducteurs[i].redirection_nom = results_conducteurs[idx].nom;
                                    } else {
                                        results_conducteurs[i].redirection_prenom = "Aucune";
                                        results_conducteurs[i].redirection_nom = "redirection";
                                    }
                                }

                                res.json(results_conducteurs);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/conducteurs/all', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Conducteurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_CTX', token) || SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {

                    bdd.query('SELECT C.* FROM conducteurs C',
                        function (error, results_conducteurs, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                res.json(false)
                            } else {
                                res.json(results_conducteurs);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/conducteurs/modifColor', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Conducteurs', null)
                res.send(false)
            }
            else if(req.body.initiales=== null || req.body.initiales=== '')
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CTX', token)) {
                        var re = "UPDATE conducteurs SET ";
                        var args = [];
                        re += "couleur = ? ";
                        args.push(req.body.couleur);

                        re += "WHERE initiales = ? ";
                        args.push(req.body.initiales);

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Conducteurs', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Modification du code couleur du conducteur : " + req.body.initiales, 'Gestion Conducteurs', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/conducteurs/redirigerPointages', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Conducteurs', null)
                res.send(false)
            }
            else if(req.body.initiales=== null || req.body.initiales=== '')
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CTX', token)) {
                    var re = "UPDATE utilisateurs SET redirection_nav_id = ? WHERE nav_id = ?";
                    var args = [];
                    args.push(req.body.destination);
                    args.push(req.body.source);

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Conducteurs', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Redirection des pointages du conducteur : " + req.body.source + " vers " + req.body.destination, 'Gestion Conducteurs', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/conducteurs/switchElectricien', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Conducteurs', null)
                res.send(false)
            }
            else if(req.body.initiales=== null || req.body.initiales=== '')
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_CTX', token)) {
                    var re = "UPDATE utilisateurs SET electricien = ? WHERE nav_id = ?";
                    var args = [];
                    args.push(req.body.status);
                    args.push(req.body.nav_id);

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Conducteurs', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Switch Electricien : " + req.body.nav_id + " sur " + req.body.status, 'Gestion Conducteurs', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });
}