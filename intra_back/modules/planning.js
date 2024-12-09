module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request, log, printLogLevel, printSemaines,
    getNBsemaine, getDate, sendMail) {

    //Informations sur les assignations
    app.get('/api/assignations/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query(
                        '(\n' +
                        '\tSELECT grand_deplacement,journee,resources.nature,assignation_code_nature,immatriculation,resources.Activite,\n' +
                        '\tresources.Actif,semaines.id,semaines.verrouillee,\n' +
                        '\tresources.matricule_resource,nom_chantier,Conducteur,code_chantier,chantier_code_pointage,jour,commentaires,chef_chantier,\n' +
                        '\ttype_assignation,date_start,date_end,resources.Nom,resources.Type,nb_semaine, resources.tuteur\n' +
                        '\tFROM semaines, \n' +
                        '\t(\n' +
                        '\t\t(\n' +
                        '\t\t\tSELECT grand_deplacement,assignations.journee, assignations.activite AS assignation_code_nature,\n' +
                        '\t\t\tassignations.matricule_resource,id_semaine,\n' +
                        '\t\t\tchantiers.nom_chantier,chantiers.Conducteur,chantiers.code_pointage as chantier_code_pointage,\n' +
                        '\t\t\tassignations.code_chantier,assignations.jour,assignations.commentaires,assignations.chef_chantier, \n' +
                        '\t\t\t"chantier" AS type_assignation FROM semaines, assignations \n' +
                        '\t\t\tLEFT JOIN chantiers ON chantiers.code_chantier=assignations.code_chantier  \n' +
                        '\t\t\tWHERE (semaines.id=assignations.id_semaine OR assignations.id_semaine IS NULL) \n' +
                        '\t\t\tAND ? BETWEEN date_start AND date_end\n' +
                        '\t\t) \n' +
                        '\t\tUNION\n' +
                        '\t\t(\n' +
                        '\t\t\tSELECT NULL as grand_deplacement,assignations_absence.journee,NULL AS assignation_code_nature,\n' +
                        '\t\t\tassignations_absence.matricule_resource,id_semaine,\n' +
                        '\t\t\tabsences.description,"rien" AS Conducteur, "nada" AS chantier_code_pointage,assignations_absence.code_absence,assignations_absence.jour,\n' +
                        '\t\t\t"ABSENCE" AS commentaires,0 AS chef_chantier,"absence" AS type_assignation FROM semaines, assignations_absence \n' +
                        '\t\t\tLEFT JOIN absences ON absences.code_absence=assignations_absence.code_absence \n' +
                        '\t\t\tWHERE (semaines.id=assignations_absence.id_semaine OR assignations_absence.id_semaine IS NULL) \n' +
                        '\t\t\tAND ? BETWEEN date_start AND date_end\n' +
                        '\t\t)\n' +
                        '\t) \n' +
                        '\tAS matable \n' +
                        '\tRIGHT JOIN resources ON resources.matricule_resource=matable.matricule_resource \n' +
                        '\tLEFT JOIN vehicules ON vehicules.chauffeur= matable.matricule_resource \n' +
                        '\tWHERE (? BETWEEN date_start AND date_end) AND NOT (matable.code_chantier = \'FERIE\' AND resources.Actif = 0) AND (resources.Activite="3.05-POSEUR" \n' +
                        '\tOR resources.Activite="3.50-ATELIER" OR resources.Activite="3.10-CHEF-EQ" \n' +
                        '\tOR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" \n' +
                        '\tOR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND" OR resources.Activite="1.08-ELECTRICITE" OR resources.Activite="4.40-DEPOT")\n' +
                        ')\n' +
                        'UNION \n' +
                        '(\n' +
                        '\tSELECT NULL as grand_deplacement,journee,assignation_code_nature,NULL AS nature,NULL AS immatriculation ,\n' +
                        '\tActivite,1 AS Actif,semaines.id,semaines.verrouillee,\n' +
                        '\tmatricule_resource,nom_chantier,Conducteur,code_chantier,chantier_code_pointage,jour,commentaires,chef_chantier,\n' +
                        '\ttype_assignation,date_start,date_end,Nom,Type, nb_semaine, NULL AS tuteur FROM semaines,\n' +
                        '\t(\n' +
                        '\t\tSELECT assignations_fantome.journee, assignations_fantome.activite AS assignation_code_nature,\n' +
                        '\t\tassignations_fantome.matricule_resource,\n' +
                        '\t\tid_semaine,chantiers.nom_chantier,chantiers.Conducteur,\n' +
                        '\t\tassignations_fantome.code_chantier,chantiers.code_pointage as chantier_code_pointage,assignations_fantome.jour,assignations_fantome.commentaires,\n' +
                        '\t\t0 AS chef_chantier, "fantome" AS type_assignation, assignations_fantome.type AS Type, \n' +
                        '\t\tassignations_fantome.nom AS Nom,"3.05-POSEUR" AS Activite, 1 AS Actif \n' +
                        '\t\tFROM semaines, assignations_fantome \n' +
                        '\t\tLEFT JOIN chantiers ON chantiers.code_chantier=assignations_fantome.code_chantier \n' +
                        '\t\tWHERE (semaines.id=assignations_fantome.id_semaine OR assignations_fantome.id_semaine IS NULL) \n' +
                        '\t\tAND ? BETWEEN date_start AND date_end\n' +
                        '\t) AS matable \n' +
                        '\tWHERE ? BETWEEN date_start AND date_end \n' +
                        ') \n' +
                        'ORDER BY Nom, journee ASC',
                        [req.params.date, req.params.date, req.params.date, req.params.date, req.params.date],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                bdd.query(
                                    'SELECT * FROM resources',
                                    [req.params.date, req.params.date, req.params.date, req.params.date, req.params.date],
                                    function (error, resources, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {
                                            var tuteurs = [];
                                            console.log("En dehors du for");
                                            for (var i = 0; i < results.length; i++) {
                                                console.log("Dans le for");
                                                if (results[i].tuteur != null && results[i].Actif == 1) {
                                                    console.log("Dans le if du for de la requête " + results);
                                                    const p = (e) => e.tuteur == results[i].tuteur;
                                                    var idx = -1;

                                                    if (tuteurs.findIndex(p) == -1) {
                                                        const obj = {
                                                            tuteur: results[i].tuteur,
                                                            apprentis: []
                                                        }

                                                        obj.apprentis.push(results[i].Nom);

                                                        tuteurs.push(obj);
                                                    }
                                                    else {
                                                        const predicat = (e) => e == results[i].Nom;
                                                        if (tuteurs[tuteurs.findIndex(p)].apprentis.findIndex(predicat) == -1)
                                                            tuteurs[tuteurs.findIndex(p)].apprentis.push(results[i].Nom);
                                                    }


                                                    for (let el of resources) {
                                                        if (el.matricule_resource == results[i].tuteur)
                                                            results[i].tuteur_nom = el.Nom;
                                                    }
                                                } else {
                                                    results[i].tuteur_nom = null;
                                                    console.log("Dans le else du for " + results[i]);
                                                }
                                            }

                                            for (var i = 0; i < results.length; i++) {
                                                const p = (e) => e.tuteur == results[i].matricule_resource;
                                                var idx = tuteurs.findIndex(p);

                                                if (idx != -1) {
                                                    results[i].apprentis = tuteurs[idx].apprentis;
                                                }
                                            }
                                            console.log(results);
                                            res.json(results);
                                        }
                                        //res.json(results);
                                    });
                            }
                            //res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            };
        });
    });

    //Liste attributs
    app.get('/api/planning/attributs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT code_ressource ,code_attribut, libelle  FROM attributs_ressource ' +
                        'INNER JOIN attributs ON attributs.code= attributs_ressource.code_attribut WHERE valeur = 1',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Liste attributs
    app.get('/api/planning/semaines/:annee', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    var annee = req.params.annee;

                    bdd.query('SELECT * FROM `semaines` WHERE YEAR(date_start) = ? OR ? = YEAR(date_end)', [annee, annee],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Liste absences
    app.get('/api/absences', function (req, obj) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    const request = require('sync-request');
                    var res = request('GET', 'https://api.batideko.fr/api/absences');
                    var json = res.getBody().toString();
                    var obj = JSON.parse(json);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/codes_nature', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT * FROM codes_nature ORDER BY code ASC ', function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                            res.json(false)
                        } else
                            res.json(results);
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //liste des code activité
    app.get('/api/planning/activites', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT code FROM activites  ORDER BY code ASC ', function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                            res.json(false)
                        } else
                            res.json(results);
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //liste des noms de chantier
    app.get('/api/planning/noms_chantiers', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT code_chantier, nom_chantier FROM chantiers ' +
                        'WHERE Actif=1 AND (code_chantier LIKE "CC%" OR code_chantier LIKE "CA%" OR  ' +
                        'code_chantier = "_ATELIER" or code_chantier = "_BUREAUX" or code_chantier = "_TRAVAUX_EPI" or ' +
                        'code_chantier = "_MEDECINE" or code_chantier = "_REUNION" or code_chantier = "CPAM CAMBRAI" or code_chantier = "CPAM MAUBEUGE" or ' +
                        'code_chantier = "CPAM VALENCIENNES" or code_chantier = "_EAE" )' +
                        'ORDER BY nom_chantier ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //liste des noms de chantier
    app.get('/api/planning/chantiers_semaine_nozone/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT semaines.id, semaines.nb_semaine, semaines.date_start, semaines.date_end, ' +
                        'chantiers.code_chantier, chantiers.nom_chantier, chantiers.Conducteur, chantiers.zone, ' +
                        'chantiers.adresse, chantiers.Ville, chantiers.code_postal, chantiers.adresse2  ' +
                        'FROM semaines, chantiers, assignations ' +
                        'WHERE ? BETWEEN date_start AND date_end ' +
                        'AND semaines.id = assignations.id_semaine ' +
                        'AND assignations.code_chantier = chantiers.code_chantier ' +
                        'GROUP BY chantiers.code_chantier, chantiers.nom_chantier, chantiers.Conducteur, chantiers.zone, ' +
                        'chantiers.adresse, chantiers.Ville, chantiers.code_postal, chantiers.adresse2, ' +
                        'semaines.id, semaines.nb_semaine, semaines.date_start, semaines.date_end ' +
                        'ORDER BY chantiers.zone ', [req.params.date],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.post('/api/planning/creation_fantome', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT id_assignation_fantome FROM assignations_fantome ' +
                        'WHERE id_semaine = ? AND matricule_resource=? AND code_chantier=? AND jour= ? ',
                        [req.body.semaine, req.body.matricule_resource, req.body.code_chantier, req.body.jour],
                        function (error, results2, fields) {
                            if (error) {
                                log("Erreur ICI : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else if (results2.length === 0) {

                                bdd.query('INSERT INTO assignations_fantome (matricule_resource, code_chantier, ' +
                                    'jour,id_semaine,nom,journee,commentaires,type) VALUES (?, ?, ?,?,?,?,?,?)',
                                    [req.body.matricule_resource, req.body.code_chantier, req.body.jour, req.body.semaine,
                                    req.body.nom, req.body.journee, req.body.commentaires, req.body.type],
                                    function (error, results2, fields) {
                                        if (error) {
                                            log("Erreur LA : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1) {
                                                var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                                log("Ajout attribution chantier " + req.body.code_chantier + ' à ' + req.body.nom +
                                                    ' le ' + date, 'Planning Chantiers', user.id)
                                            }
                                            res.json(results2);
                                        }
                                    })
                            } else
                                res.json(false);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //Création assignation
    app.post('/api/planning/creation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    var journee = (req.body.journee ? req.body.journee : 0)
                    bdd.query('SELECT id_assignation FROM assignations ' +
                        'WHERE id_semaine = ? AND matricule_resource=? AND code_chantier=? AND jour= ? ',
                        [req.body.semaine, req.body.matricule_resource, req.body.code_chantier, req.body.jour],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else if (results.length === 0) {

                                bdd.query('INSERT INTO assignations (matricule_resource, code_chantier, ' +
                                    'jour,id_semaine, commentaires, chef_chantier,activite,journee,grand_deplacement) ' +
                                    'VALUES (?,?,?,?,?,?,?,?,?)',
                                    [req.body.matricule_resource, req.body.code_chantier, req.body.jour,
                                    req.body.semaine, req.body.comm, req.body.chef_chantier, req.body.activite, journee, req.body.grand_deplacement],
                                    function (error, results2, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)

                                            console.log(req.body.code_chantier)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1) {
                                                var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                                log("Ajout chantier " + req.body.code_chantier + ' à ' + req.body.matricule_resource +
                                                    ' le ' + date, 'Planning Chantiers', user.id)
                                            }
                                            res.json(results2);
                                        }

                                    });
                            } else
                                res.json(2)
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.put('/api/planning/verrouillage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'special', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query("UPDATE semaines SET verrouillee = 1 WHERE id= ? ", [req.body.id_semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                res.json('true');
                                log("Verrouillage planning : " + req.body.id_semaine, 'Planning Chantiers', user.id)
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    app.put('/api/planning/deverrouillage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'special', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query("UPDATE semaines SET verrouillee = 0 WHERE id= ? ", [req.body.id_semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                res.json('true');
                                log("Verrouillage planning : " + req.body.id_semaine, 'Planning Chantiers', user.id)
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //Modifier des assignations
    app.put('/api/planning/modif', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    if (req.body.comm === 'ABSENCE') {


                        var re = "UPDATE assignations_absence SET ";
                        var args = [];

                        if (req.body.jour != null && req.body.matricule_resource != null) {
                            re += "code_absence = ? ";
                            args.push(req.body.chantier);

                            re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_absence=? ";
                            args.push(req.body.matricule_resource);
                            args.push(req.body.jour);
                            args.push(req.body.semaine);
                            args.push(req.body.ancien_chantier);

                            bdd.query(re, args, function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Planning Chantiers', user.id)
                                    res.json(false)
                                } else {
                                    if (printLogLevel() >= 1) {
                                        var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                        log("Modification absence " + req.body.chantier + ' à ' + req.body.matricule_resource +
                                            ' le ' + date, 'Planning Chantiers', user.id)
                                    }
                                    res.json(results);
                                }
                            });
                        } else {
                            res.send(false);

                        }
                    } else {
                        var re = "UPDATE assignations SET id_mytime = null, ";
                        var args = [];

                        if (req.body.jour != null && req.body.matricule_resource != null) {
                            console.log(req.body);
                            re += "code_chantier = ? ";
                            args.push(req.body.chantier);
                            re += ", commentaires = ? ";
                            args.push(req.body.comm);
                            re += ", chef_chantier = ? ";
                            args.push(req.body.chef_chantier);
                            re += ", grand_deplacement = ? ";
                            args.push(req.body.grand_deplacement);
                            re += ", journee = ? ";
                            args.push(req.body.journee);

                            re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_chantier=? AND journee = ?"; //
                            args.push(req.body.matricule_resource);
                            args.push(req.body.jour);
                            args.push(req.body.semaine);
                            args.push(req.body.ancien_chantier);
                            args.push(req.body.old_journee);
                            bdd.query(re, args, function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Planning Chantiers', user.id)
                                    res.json(false)
                                } else {
                                    bdd.query("UPDATE assignations SET id_mytime = null WHERE matricule_resource = ? AND jour= ? AND id_semaine= ?", [req.body.matricule_resource, req.body.jour, req.body.semaine], function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1) {
                                                var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                                log("Modification attribution chantier " + req.body.chantier + ' à ' +
                                                    req.body.matricule_resource + ' le ' + date,
                                                    'Planning Chantiers', user.id)
                                            }
                                            res.json(results);
                                        }
                                    });
                                }
                            });
                        } else {
                            res.send(false);

                        }
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Modifier des assignations fantome
    app.put('/api/planning/modif_fantome', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    var re = "UPDATE assignations_fantome SET ";
                    var args = [];

                    if (req.body.jour != null && req.body.matricule_resource != null) {
                        re += "code_chantier = ? ";
                        args.push(req.body.chantier);
                        re += ", commentaires = ? ";
                        args.push(req.body.comm);
                        re += ", journee = ? ";
                        args.push(req.body.journee);

                        re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_chantier=? AND journee = ? ";
                        args.push(req.body.matricule_resource);
                        args.push(req.body.jour);
                        args.push(req.body.semaine);
                        args.push(req.body.ancien_chantier);
                        args.push(req.body.old_journee);

                        console.log(re)
                        console.log(args)

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                    log("Modification attribution chantier " + req.body.chantier + ' à ' +
                                        req.body.matricule_resource + ' le ' + date,
                                        'Planning Chantiers', user.id)
                                }
                                res.json(results);
                            }
                        });
                    } else {
                        res.send(false);

                    }
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    //Suppression assignation
    app.delete('/api/assignation/suppression/:matricule/:semaine/:jour/:comm/:chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }

            const token = req.headers.authorization.split(' ')[1];
            const user = jsonWebToken.decode(token);

            if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {

                if (req.params.comm === 'ABSENCE' && SECURITY.canAccessRessource(user, 'w', 'M_ABSENCE', token)) {
                    bdd.query('DELETE FROM assignations_absence WHERE matricule_resource=? AND code_absence=? AND jour=? AND id_semaine=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    console.log(req.params)
                                    bdd.query('SELECT * FROM resources WHERE matricule_resource = ?',
                                        [req.params.matricule], function (error, result_r, fields) {
                                            if (error) {
                                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            } else {
                                                var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                                log("Suppression absence " + req.params.chantier + ' de ' + result_r[0].Nom + ' (' + req.params.matricule + ') ' +
                                                    'le ' + date + " par " + user.prenom + ' ' + user.nom, user.id)

                                                sendMail(['alenoire@cuppens.fr', 'afroment@cuppens.fr'], "[MyCuppens] Suppression d'absence depuis le planning chantier",
                                                    "Suppression absence " + req.params.chantier + ' de ' + result_r[0].Nom + ' (' + req.params.matricule + ') ' +
                                                    'le ' + date + " par " + user.prenom + ' ' + user.nom);
                                            }
                                        });
                                }
                                res.json(results);
                            }
                        });
                } else if (req.params.comm === '_fantome') {
                    bdd.query('DELETE FROM assignations_fantome WHERE matricule_resource=? AND code_chantier=? AND jour=? AND id_semaine=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {

                                bdd.query("UPDATE assignations SET id_mytime = null WHERE matricule_resource = ? AND jour= ? AND id_semaine= ?",
                                    [req.params.matricule, req.params.jour, req.params.semaine], function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {

                                        }
                                    });

                                if (printLogLevel() >= 1) {
                                    var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                    log("Suppression attribution chantier absence " + req.params.chantier + ' à ' +
                                        req.params.matricule + ' le ' + date,
                                        'Planning Chantiers', user.id)
                                }
                                res.json(results);
                            }
                        });
                } else {
                    bdd.query('DELETE FROM assignations WHERE matricule_resource=? AND code_chantier=? AND jour=? AND id_semaine=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {

                                bdd.query("UPDATE assignations SET id_mytime = null WHERE matricule_resource = ? AND jour= ? AND id_semaine= ?",
                                    [req.params.matricule, req.params.jour, req.params.semaine], function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {

                                        }
                                    });
                                if (printLogLevel() >= 1) {
                                    var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                    log("Suppression attribution chantier absence " + req.params.chantier + ' à ' +
                                        req.params.matricule + ' le ' + date,
                                        'Planning Chantiers', user.id)
                                }
                                res.json(results);
                            }
                        });
                }
            }
            else
                res.json('SECURITY_ERROR');
        });
    });

    //Suppression de toute les assignations d'une journée
    app.delete('/api/assignation/suppression/:matricule/:semaine/:jour', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {

                    bdd.query('DELETE FROM assignations WHERE assignations.matricule_resource=? ' +
                        'AND assignations.jour=? AND assignations.id_semaine=?',
                        [req.params.matricule, req.params.jour, req.params.semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                    log("Suppression attributions chantier de " + req.params.matricule_resource +
                                        " de la journée " + date,
                                        'Planning Chantiers', user.id)
                                }
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Modifier le statut de chef chantier
    app.put('/api/planning/statut_chef_chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                console.log('MODIF CHEF CHANTIER')
                console.log(req.body)

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('SELECT chef_chantier FROM assignations ' +
                        'WHERE matricule_resource= ? AND code_chantier=? AND id_semaine= ? AND jour = ?',
                        [req.body.matricule, req.body.chantier, req.body.semaine, req.body.jour],
                        function (error, result, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                var re = "UPDATE assignations SET ";
                                var args = [];
                                if (result[0].chef_chantier === 0)
                                    re += "chef_chantier = 1 ";
                                else
                                    re += "chef_chantier = 0 ";
                                re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_chantier=? ";
                                args.push(req.body.matricule);
                                args.push(req.body.jour);
                                args.push(req.body.semaine);
                                args.push(req.body.chantier);
                                bdd.query(re, args, function (error, results, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Planning Chantiers', user.id)
                                        res.json(false)
                                    } else {
                                        if (printLogLevel() >= 1) {
                                            var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                            log("Modification du statut de chef d'équipe de  " + req.body.matricule_resource +
                                                ' le ' + date, 'Planning Chantiers', user.id)
                                        }
                                        res.json(result);
                                    }
                                });
                            }

                        })
                }
                res.json('SECURITY_ERROR');
            }
        });
    });

    //Modifier le statut de chef chantier
    app.put('/api/planning/statut_chef_chantier_semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {

                    var re = "UPDATE assignations SET ";
                    var args = [];

                    re += "chef_chantier = 1 ";

                    re += "WHERE matricule_resource = ? AND id_semaine= ? ";
                    args.push(req.body.matricule);
                    args.push(req.body.semaine);
                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1) {
                                var date = getNBsemaine(printSemaines(), req.body.semaine)
                                log("Modification du statut de chef d'équipe de  " + req.body.matricule_resource +
                                    ' sur la semaine ' + date, 'Planning Chantiers', user.id)
                            }
                            res.json(true);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    //Suppression assignations d'une semaine
    app.delete('/api/assignation/suppression/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query('DELETE FROM assignations WHERE id_semaine=?', [req.params.semaine], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                            res.json(false)
                        } else {
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Suppression assignations d'une personne fantome sur une semaine
    app.delete('/api/assignation/suppression/:matricule/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    bdd.query("SELECT matricule_resource FROM resources WHERE matricule_resource =? AND \"Type\" != 'ADMINISTRATIF' AND Actif = 1",
                        [req.params.matricule], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else if (results.length === 0) {
                                bdd.query('DELETE FROM assignations_fantome WHERE id_semaine=? AND matricule_resource =?',
                                    [req.params.semaine, req.params.matricule], function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1) {
                                                var date = getNBsemaine(printSemaines(), req.params.semaine)
                                                log("Suppression des attributions chantier de " + req.params.matricule +
                                                    ' sur la semaine ' + date,
                                                    'Planning Chantiers', user.id)
                                            }
                                            res.json(results);
                                        }
                                    });
                            } else {
                                bdd.query('DELETE FROM assignations WHERE id_semaine=? AND matricule_resource =?',
                                    [req.params.semaine, req.params.matricule],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                                            res.json(false)
                                        } else {
                                            if (printLogLevel() >= 1) {
                                                var date = getNBsemaine(printSemaines(), req.params.semaine)
                                                log("Suppression des attributions chantiers et absence de " +
                                                    req.params.matricule + ' sur la semaine ' + date,
                                                    'Planning Chantiers', user.id)
                                            }
                                            res.json(results);
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

    app.post('/api/copier_semaine/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;

                    bdd.query('SELECT code_chantier, matricule_resource, jour,journee, commentaires, chef_chantier,activite ' +
                        'FROM assignations WHERE id_semaine = ? ORDER BY matricule_resource ASC ; ' +
                        'SELECT code_absence, jour, matricule_resource FROM assignations_absence WHERE id_semaine = ?+1 ' +
                        'ORDER BY matricule_resource',
                        [semaineAcopier, semaineAcopier], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Chantiers', user.id)
                                res.json(false)
                            } else {
                                for (let ass of results[0]) {
                                    const body = {
                                        matricule_resource: ass.matricule_resource,
                                        chantier: ass.code_chantier,
                                        jour: ass.jour,
                                        semaine: semaine,
                                        chef_chantier: ass.chef_chantier,
                                        commentaires: ass.commentaires,
                                        activite: ass.activite,
                                        journee: ass.journee
                                    }
                                    var absent = false
                                    for (let abs of results[1]) {
                                        if (abs.jour == body.jour && abs.matricule_resource == body.matricule_resource)
                                            absent = true
                                    }
                                    if (!absent) {
                                        bdd.query('INSERT INTO assignations (matricule_resource, code_chantier, jour,' +
                                            'id_semaine,chef_chantier, commentaires,activite,journee) ' +
                                            'VALUES (?, ?, ?,?,?, ?,?,?)',
                                            [body.matricule_resource, body.chantier, body.jour, body.semaine, body.chef_chantier,
                                            body.commentaires, body.activite, body.journee],
                                            function (error2, results2, fields2) {
                                                if (error2) {
                                                    log("Erreur : " + error2, 'Planning Chantiers', user.id)
                                                    res.json(false)
                                                }
                                            });
                                    }
                                }
                            }
                        });
                    if (printLogLevel() >= 1) {
                        var date = getNBsemaine(printSemaines(), semaine)
                        log("Copie de la semaine précédente pour la semaine " + date,
                            'Planning Chantiers', user.id)
                    }
                    res.json(true);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    })


    app.post('/api/planning/copier_ligne/:semaine/:resourceAcopier/:resource', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_G', token)) {
                    var resourceAcopier = req.params.resourceAcopier;
                    var resource = req.params.resource;
                    var semaine = req.params.semaine;


                    bdd.query('SELECT * FROM assignations_fantome WHERE matricule_resource = ? AND id_semaine = ?', [resource, semaine], (error, fantome, fields) => {
                        if (error) {
                            log("Erreur : " + error, 'Planning Chantiers', user.id)
                            res.json(false)
                        } else {
                            var table = 'assignations';
                            if (fantome.length >= 1) { //on est sur de la ressource OK
                                table = 'assignations_fantome';
                                console.log("ASSIGNATION FANTOME");
                            }

                            bdd.query('DELETE FROM ' + table + ' WHERE  id_semaine = ? AND matricule_resource = ?  ',
                                [semaine, resource], function (error, results, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Planning Chantiers', user.id)
                                        res.json(false)
                                    } else {
                                        bdd.query('SELECT * FROM assignations WHERE id_semaine = ? AND matricule_resource = ? ;' +
                                            'SELECT code_absence, jour, matricule_resource FROM assignations_absence ' +
                                            'WHERE id_semaine = ? AND matricule_resource =? ',
                                            [semaine, resourceAcopier, semaine, resource], function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Planning Chantiers', user.id)
                                                    res.json(false)
                                                } else {
                                                    if (table == 'assignations_fantome') {
                                                        if (fantome.length > 0) {
                                                            for (let ass of results[0]) {
                                                                q = 'INSERT INTO assignations_fantome (matricule_resource, code_chantier, jour,' +
                                                                    'id_semaine,nom, commentaires,activite,journee,type) ' +
                                                                    'VALUES (?, ?, ?,?,?, ?,?,?,?)';
                                                                const body = {
                                                                    matricule_resource: resource,
                                                                    chantier: ass.code_chantier,
                                                                    jour: ass.jour,
                                                                    semaine: semaine,
                                                                    nom: fantome[0].nom,
                                                                    commentaires: ass.commentaires,
                                                                    activite: ass.activite,
                                                                    journee: ass.journee,
                                                                    type: fantome[0].type
                                                                }

                                                                var absent = false
                                                                for (let abs of results[1]) {
                                                                    if (abs.jour == body.jour && abs.matricule_resource == body.matricule_resource)
                                                                        absent = true
                                                                }
                                                                if (!absent) {
                                                                    bdd.query(q,
                                                                        [body.matricule_resource, body.chantier, body.jour, body.semaine, body.nom,
                                                                        body.commentaires, body.activite, body.journee, body.type],
                                                                        function (error2, results2, fields2) {
                                                                            if (error2) {
                                                                                log("Erreur : " + error2, 'Planning Chantiers', user.id)
                                                                                res.json(false)
                                                                            }
                                                                        });
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        for (let ass of results[0]) {
                                                            var q = 'INSERT INTO ' + table + ' (matricule_resource, code_chantier, jour,' +
                                                                'id_semaine,chef_chantier, commentaires,activite,journee) ' +
                                                                'VALUES (?, ?, ?,?,?, ?,?,?)';
                                                            const body = {
                                                                matricule_resource: resource,
                                                                chantier: ass.code_chantier,
                                                                jour: ass.jour,
                                                                semaine: semaine,
                                                                chef_chantier: 0,
                                                                commentaires: ass.commentaires,
                                                                activite: ass.activite,
                                                                journee: ass.journee
                                                            }

                                                            var absent = false
                                                            for (let abs of results[1]) {
                                                                if (abs.jour == body.jour && abs.matricule_resource == body.matricule_resource)
                                                                    absent = true
                                                            }
                                                            if (!absent) {
                                                                bdd.query(q,
                                                                    [body.matricule_resource, body.chantier, body.jour, body.semaine, body.chef_chantier,
                                                                    body.commentaires, body.activite, body.journee],
                                                                    function (error2, results2, fields2) {
                                                                        if (error2) {
                                                                            log("Erreur : " + error2, 'Planning Chantiers', user.id)
                                                                            res.json(false)
                                                                        }
                                                                    });
                                                            }
                                                        }
                                                    }
                                                }
                                            });
                                    }
                                });
                            if (printLogLevel() >= 1) {
                                var date = getNBsemaine(printSemaines(), semaine)
                                log("Copie des attributions de " + resourceAcopier + " sur " + resource + " pour la semaine " + date,
                                    'Planning Chantiers', user.id)
                            }

                        }
                    });


                    res.json(true);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    })

};
