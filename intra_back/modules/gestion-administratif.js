module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request, log, printLogLevel, printSemaines,
    getNBsemaine, getDate) {


    //liste des administratifs
    app.get('/api/gestion-administratif', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Administratif', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'A_GESTION_ADMINISTRATIF', token)) {
                    bdd.query("SELECT resources.*, societes.nom as nom_societe\n" +
                        "FROM resources LEFT JOIN societes ON societes.id = resources.societe\n" +
                        "WHERE Type = 'ADMINISTRATIF' ORDER BY Nom ASC",
                        function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Administratif', user.id);
                            res.json(false);
                        } else
                            var administratif = []
                        for (let res of results) {
                            var index = administratif.map(function (e) {
                                return e.matricule_resource;
                            }).indexOf(res.matricule_resource);
                            if (index === -1) {
                                administratif.push({
                                    matricule_resource: res.matricule_resource,
                                    Nom: res.Nom,
                                    email: res.email,
                                    societe: res.societe,
                                    nom_societe: res.societe === null ? 'Aucune' : res.nom_societe,

                                });
                            } else if (res.valeur == "1") {
                                administratif[index].attributs.push(
                                    {
                                        code_attribut: res.code_attribut,
                                        libelle: res.libelle
                                    }
                                );
                            }
                        }
                        res.json(administratif);
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //creation d'un administratif
    app.post('/api/gestion-administratif/creation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Administratif', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ADMINISTRATIF', token)) {
                    bdd.query("INSERT INTO resources (matricule_resource, Nom, email, Type) VALUES (?, ?, ?, 'ADMINISTRATIF')",
                        [req.body.matricule, req.body.nom, req.body.email], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Administratif', user.id);
                                res.json(false);
                            } else {
                                log("Création de l'administratif " + req.body.nom, 'Gestion Administratif', user.id);
                                res.json(results);
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //modification d'un administratif
    app.put('/api/gestion-administratif/edit', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Administratif', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ADMINISTRATIF', token)) {
                    bdd.query("UPDATE resources SET Nom = ?, email = ?, matricule_resource = ? WHERE matricule_resource = ?",
                        [req.body.nom, req.body.email, req.body.matricule, req.body.id], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Administratif', user.id);
                                res.json(false);
                            } else {
                                log("Modification de l'administratif " + req.body.id, 'Gestion Administratif', user.id);
                                res.json(results);
                            }
                        })
                }
                res.json('SECURITY_ERROR');
            }
        })
    });

    //suppression d'un administratif
    app.delete('/api/gestion-administratif/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Administratif', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ADMINISTRATIF', token)) {
                    bdd.query("DELETE FROM resources WHERE matricule_resource=?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Administratif', user.id);
                            res.json(false);
                        } else {
                            log("Erreur : " + error, 'Gestion Administratif', user.id);
                            res.json(results);
                        }
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    app.put('/api/gestion-administratif/societe', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Administratif ', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ADMINISTRATIF', token)) {

                    if (req.body._data_ != '') {

                        var re;
                        var args = [];

                        if (req.body._data_ == '0' || req.body._data_ == '_NONE') {
                            re = "UPDATE resources SET societe = NULL WHERE matricule_resource = ?";
                            args.push(req.body.id);
                        } else {
                            re = "UPDATE resources SET societe = ? WHERE matricule_resource = ?";
                            args.push(req.body._data_);
                            args.push(req.body.id);
                        }

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Administratif', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    log("Modification Administratif / SOCIETE " + req.body.id,
                                        'Gestion Administratif', user.id)
                                }
                                res.json(results);
                            }
                        });

                    }
                    else
                        res.send('SECURITY_ERROR');
                }
            }
        });
    });
}