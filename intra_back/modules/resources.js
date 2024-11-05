module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log, printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

    //Liste des resources
    app.get('/api/resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            } else {
                const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                bdd.query('SELECT * FROM resources ORDER BY Nom ASC ', function (error, results, fields) {
                    if (error) {
                        log("Erreur : " + error, 'Resources', user.id)
                        res.json(false)
                    } else
                        res.json(results);
                })
            }
        })
    });
    //gestion -resources
    app.get('/api/gestion-resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_RESSOURCES', token)) {
                    bdd.query('SELECT resources.*, societes.nom as nom_societe FROM resources\n' +
                        'LEFT JOIN attributs_ressource ON attributs_ressource.code_ressource=resources.matricule_resource \n' +
                        'LEFT JOIN attributs on attributs.code=code_attribut \n' +
                        'LEFT JOIN societes ON societes.id = resources.societe\n' +
                        'ORDER BY Nom ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Resources', user.id)
                                res.json(false)
                            } else {
                                var resources = []
                                for (let res of results) {
                                    var index = resources.map(function (e) {
                                        return e.matricule_resource;
                                    }).indexOf(res.matricule_resource);
                                    if (index === -1) {
                                        resources.push({
                                            matricule_resource: res.matricule_resource,
                                            Nom: res.Nom,
                                            Activite: res.Activite,
                                            Actif: res.Actif,
                                            nature: res.nature,
                                            Type: res.Type,
                                            tuteur: res.tuteur,
                                            societe: res.societe,
                                            nom_societe: res.societe === null ? 'Aucune':res.nom_societe,
                                            id_mytime: res.id_mytime,
                                            code_pointage: res.code_pointage,
                                            password_mytime: res.password_mytime,
                                            attributs: (res.valeur == "1" ? [
                                                {
                                                    code_attribut: res.code_attribut,
                                                    libelle: res.libelle
                                                }] : []),
                                            valeur: res.valeur
                                        });
                                    } else if (res.valeur == "1") {
                                        resources[index].attributs.push(
                                            {
                                                code_attribut: res.code_attribut,
                                                libelle: res.libelle
                                            }
                                        );
                                    }
                                }
                                res.json(resources);
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //liste des attributs  gestion -resources
    app.get('/api/gestion-resources/attributs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Resources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_RESSOURCES', token)) {
                    bdd.query('SELECT * FROM attributs ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Resources', user.id);
                                res.send(error);
                            } else {
                                res.json(results);
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //inserer un attribut
    app.put('/api/gestion-resources/inserer', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Resources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {
                    bdd.query('SELECT * FROM resources ' +
                        'LEFT JOIN attributs_ressource ON code_ressource=matricule_resource ' +
                        'LEFT JOIN attributs on attributs.code=code_attribut ' +
                        'WHERE code_ressource = ? AND code_attribut = ? ORDER BY Nom ASC ',
                        [req.body.code_ressource, req.body.code_attribut],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Resources', user.id);
                                res.json(false);
                            } else if (results.length === 0) {
                                bdd.query('INSERT INTO attributs_ressource (code_attribut, code_ressource, valeur) ' +
                                    'VALUES (?,?,"1")',
                                    [req.body.code_attribut, req.body.code_ressource],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Gestion Resources', user.id);
                                            res.send(error);
                                        } else {
                                            res.json(results);
                                        }
                                    })
                            } else {
                                bdd.query('UPDATE attributs_ressource SET valeur = 1 WHERE code_ressource = ? AND code_attribut = ? ',
                                    [req.body.code_ressource, req.body.code_attribut],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Gestion Resources', user.id);
                                            res.send(error);
                                        } else {
                                            res.json(results);
                                        }
                                    })
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //supprimer un attribut
    app.put('/api/gestion-resources/suppression', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Resources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {
                    bdd.query('UPDATE attributs_ressource SET valeur = 0 WHERE code_ressource = ? AND code_attribut = ? ',
                        [req.body.code_ressource, req.body.code_attribut],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Resources', user.id);
                                res.send(error);
                            } else {
                                res.json(results);
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //liste salaries cuppens
    app.get('/api/resources/salarie', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            }
            else {
                const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                bdd.query('SELECT * FROM resources LEFT JOIN vehicules ON matricule_resource= chauffeur ' +
                    'WHERE resources.type="SALARIE" OR resources.type="STAGIAIRE" ORDER BY resources.Nom ASC' ,
                    function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Resources', user.id)
                            res.json(false)
                        }
                        else
                            res.json(results);
                    })
            };
        });
    });

    //liste salaries cuppens
    app.get('/api/resources/salaries', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            }
            else {
                const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                bdd.query('SELECT * FROM resources LEFT JOIN vehicules ON matricule_resource= chauffeur ' +
                    'WHERE (resources.type="SALARIE" OR resources.type="STAGIAIRE") AND Actif=1 ORDER BY resources.Nom ASC' ,
                    function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Resources', user.id)
                            res.json(false)
                        }
                        else
                            res.json(results);
                    })
            };
        });
    });

    //Modification de l'actif d'une ressource
    app.put('/api/resources/actif', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {
                    var re = "UPDATE resources SET ";
                    var args = [];

                    re += "Actif = ? ";
                    args.push(req.body.Actif);
                    re += "WHERE matricule_resource= ? ";
                    args.push(req.body.id);

                    var actif = (req.body.Actif === 1 ? "Actif" : "Sorti")

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Resources', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification du statut de la ressource " + req.body.id + ' en ' + actif, 'Gestion Resources', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/resources/tuteur', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ressources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {

                    if(req.body._data_ != ''){

                        var re;
                        var args = [];

                        if(req.body._data_ == '_NONE'){
                            re = "UPDATE resources SET tuteur = NULL WHERE matricule_resource = ?";
                            args.push(req.body.id);
                        } else{
                            re = "UPDATE resources SET tuteur = ? WHERE matricule_resource = ?";
                            args.push(req.body._data_);
                            args.push(req.body.id);
                        }

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Ressources', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    log("Modification Tuteur " + req.body.id,
                                        'Gestion Ressources', user.id)
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

    app.put('/api/resources/idPointage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ressources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {

                    if(req.body._data_ != ''){

                        var re;
                        var args = [];

                        if(req.body._data_ == '_NONE'){
                            re = "UPDATE resources SET id_mytime = NULL WHERE matricule_resource = ?";
                            args.push(req.body.id);
                        } else{
                            re = "UPDATE resources SET id_mytime = ? WHERE matricule_resource = ?";
                            args.push(req.body._data_);
                            args.push(req.body.id);
                        }

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Ressources', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    log("Modification Ressource / ID MYTIME " + req.body.id,
                                        'Gestion Ressources', user.id)
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


    app.put('/api/resources/societe', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ressources', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_RESSOURCES', token)) {

                    if(req.body._data_ != ''){

                        var re;
                        var args = [];

                        if(req.body._data_ == '0' || req.body._data_ == '_NONE'){
                            re = "UPDATE resources SET societe = NULL WHERE matricule_resource = ?";
                            args.push(req.body.id);
                        } else{
                            re = "UPDATE resources SET societe = ? WHERE matricule_resource = ?";
                            args.push(req.body._data_);
                            args.push(req.body.id);
                        }

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Ressources', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    log("Modification Ressource / SOCIETE " + req.body.id,
                                        'Gestion Ressources', user.id)
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
};
