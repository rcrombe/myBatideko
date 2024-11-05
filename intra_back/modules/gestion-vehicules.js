module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, sync_request,log,printLogLevel,semaine) {
    const loglevel = printLogLevel()

    //obtenir la liste des vehicules
    app.get('/api/gestion_vehicules', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_VEHICULES', token)) {
                    bdd.query('SELECT vehicules.domicile,vehicules.dispo,vehicules.vendu,immatriculation,flocage,vehicules.type,nb_places,\n' +
                        'resources.matricule_resource, \n' +
                        'resources.Nom,controle_technique, kilometrage, certificat_air, carte, gazole, \n' +
                        'commentaire, derniere_modif_km,DATEDIFF(NOW(), controle_technique) AS diff ,\n' +
                        'vehicules.controle_pollution, DATEDIFF(NOW(), controle_pollution) AS diff_pollution,  \n' +
                        'vehicules.fin_location, DATEDIFF(NOW(), fin_location) AS diff_location,  \n' +
                        'vehicules.fin_stationnement, DATEDIFF(NOW(), fin_stationnement) AS diff_stationnement,  \n' +
                        'vehicules.bureaux  \n' +
                        'FROM vehicules\n' +
                        'LEFT JOIN resources ON resources.matricule_resource=vehicules.chauffeur \n' +
                        'WHERE vendu = 0 ORDER BY type ASC',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Véhicules', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }

        });
    });
    //liste des chauffeurs possibles
    app.get('/api/gestion_vehicules/chauffeurs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_VEHICULES', token)) {
                    bdd.query('SELECT matricule_resource, Nom ' +
                        'FROM resources WHERE Actif=1 ORDER BY Nom ASC ', function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Véhicules', user.id)
                            res.json(false)
                        } else
                            res.json(results);
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }

        });
    });
    //Creer un vehicule
    app.post('/api/gestion_vehicules/creation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            }  else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    bdd.query('SELECT immatriculation FROM vehicules WHERE immatriculation = ?',
                        [req.body.immatriculation], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Véhicules', user.id)
                                res.json(false)
                            } else if (results.length !== 0)
                                res.json(false)
                            else {
                                bdd.query('INSERT INTO vehicules (immatriculation, flocage, type, nom, chauffeur, nb_places,  ' +
                                    'controle_technique, kilometrage, certificat_air, carte, gazole, commentaire,' +
                                    'derniere_modif_km,domicile,controle_pollution,fin_location,fin_stationnement) ' +
                                    'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                    [req.body.immatriculation, req.body.flocage, req.body.type, req.body.nom, req.body.chauffeur,
                                        req.body.nb_places, req.body.controle_technique, req.body.kilometrage, req.body.certificat_air,
                                        req.body.carte, req.body.gazole, req.body.commentaire, req.body.derniere_modif_km,
                                        req.body.domicile,req.body.controle_pollution,req.body.fin_location,req.body.fin_stationnement],
                                    function (error2, results2, fields) {
                                        if (error2) {
                                            log("Erreur : " + error2, 'Gestion Véhicules', user.id)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1)
                                                log("Création de véhicule : " + req.body.immatriculation,
                                                    'Gestion véhicules', user.id)
                                            res.json(results2);
                                        }
                                    });
                            }

                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });
    //Supprimer un vehicule
    app.delete('/api/gestion_vehicules/suppression/:immatriculation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            }  else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    bdd.query('DELETE FROM vehicules WHERE immatriculation=?',
                        [req.params.immatriculation], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Véhicules', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Suppression du véhicule : " + req.params.immatriculation,
                                        'Gestion véhicules', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Modifier le vehicules
    app.put('/api/gestion_vehicules/modifier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            }
            else if(req.body.immatriculation!=''){
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    var immatriculation = req.body.immatriculation;
                    var chauffeur = req.body.chauffeur;
                    var re = "UPDATE vehicules SET ";
                    var args = [];
                    if (req.body.chauffeur != '') {
                        re += "chauffeur = ? ";
                        args.push(req.body.chauffeur);
                    } else {
                        re += "chauffeur = chauffeur ";
                    }
                    if (req.body.flocage != '') {
                        re += ", flocage = ? ";
                        args.push(req.body.flocage);
                    }
                    if (req.body.derniere_modif_km != '') {
                        re += ", derniere_modif_km = ? ";
                        args.push(req.body.derniere_modif_km);
                    }
                    if (req.body.nom != '') {
                        re += ", nom = ? ";
                        args.push(req.body.nom);
                    }
                    if (req.body.domicile == 0 || req.body.domicile == 1) {
                        re += ", domicile = ? ";
                        args.push(req.body.domicile);
                    }
                    if (req.body.nb_places != '') {
                        re += ", nb_places = ? ";
                        args.push(req.body.nb_places);
                    }
                    if (req.body.controle_technique != '') {
                        re += ", controle_technique = ? ";
                        args.push(req.body.controle_technique);
                    }
                    if (req.body.controle_pollution != '') {
                        re += ", controle_pollution = ? ";
                        args.push(req.body.controle_pollution);
                    }
                    if (req.body.kilometrage != '') {
                        re += ", kilometrage = ? ";
                        args.push(req.body.kilometrage);
                    }
                    if (req.body.certificat_air != '') {
                        re += ", certificat_air = ? ";
                        args.push(req.body.certificat_air);
                    }
                    if (req.body.carte != '') {
                        re += ", carte = ? ";
                        args.push(req.body.carte);
                    }
                    if (req.body.gazole != '') {
                        re += ", gazole = ? ";
                        args.push(req.body.gazole);
                    }
                    if (req.body.fin_location != '') {
                        re += ", fin_location = ? ";
                        args.push(req.body.fin_location);
                    }
                    if (req.body.fin_stationnement != '') {
                        re += ", fin_stationnement = ? ";
                        args.push(req.body.fin_stationnement);
                    }
                    if (req.body.commentaire != null) {
                        re += ", commentaire = ? ";
                        args.push(req.body.commentaire);
                    }
                    if (req.body.type != '') {
                        re += ", type = ? ";
                        args.push(req.body.type);
                    }
                    re += "WHERE immatriculation = ? ";
                    args.push(req.body.immatriculation);
                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Véhicules', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification du véhicule : " + req.body.immatriculation,
                                    'Gestion véhicules', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
            else
                res.send(false);
        });
    });

    app.put('/api/gestion_vehicules/dispo', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    var re = "UPDATE vehicules SET ";
                    var args = [];

                    re += "dispo = ? ";
                    args.push(req.body.dispo);
                    re += "WHERE immatriculation= ? ";
                    args.push(req.body.id);

                    var dispo = (req.body.dispo === 1 ? "Disponible" : "Indisponible")

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Véhicules', user.id)
                            res.json(false)
                        } else {
                            if (loglevel >= 2)
                                log("Modification du statut du véhicules " + req.body.id + ' en ' + dispo,
                                    'Gestion Véhicules', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/gestion_vehicules/bureaux', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    var re = "UPDATE vehicules SET ";
                    var args = [];

                    re += "bureaux = ? ";
                    args.push(req.body.bureaux);
                    re += "WHERE immatriculation= ? ";
                    args.push(req.body.id);

                    var dispo = (req.body.bureaux === 1 ? "Bureaux" : "Chantier")

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Véhicules', user.id)
                            res.json(false)
                        } else {
                            if (loglevel >= 2)
                                log("Modification de l'assignation du véhicules " + req.body.id + ' en ' + dispo,
                                    'Gestion Véhicules', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/gestion_vehicules/vendu', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
            if (err) {
                log("Erreur : " + err, 'Gestion Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_VEHICULES', token)) {
                    var re = "UPDATE vehicules SET ";
                    var args = [];

                    re += "vendu = ? ";
                    args.push(req.body.vendu);
                    re += "WHERE immatriculation= ? ";
                    args.push(req.body.immatriculation);

                    var vente = (req.body.vendu === 1 ? "Vendu" : "Non vendu")

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Véhicules', user.id)
                            res.json(false)
                        } else {
                            if (loglevel >= 2)
                                log("Modification du statut vente du véhicules " + req.body.id + ' en ' + vente,
                                    'Gestion Véhicules', user.id)
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
