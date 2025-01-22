module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request, log, printLogLevel, printSemaines,
    getNBsemaine, getDate) {

    //Informations sur les assignations_st avec resources sans assignations
    app.get('/api/planning_st/assignations_st/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_ST', token)) {

                    /*bdd.query('(SELECT semaines.date_start,semaines.date_end,semaines.nb_semaine,semaines.id AS id_semaine,' +
                     'resources_st.id, matable.nom_chantier,matable.code_chantier,Conducteur,"ST" AS type_assignation,' +
                     'matable.jour,matable.commentaires,resources_st.Nom FROM semaines,(SELECT semaines.id,' +
                     'assignations_st.matricule_resource, chantiers.nom_chantier,chantiers.Conducteur,' +
                     'assignations_st.code_chantier,assignations_st.jour,assignations_st.commentaires ' +
                     'FROM semaines,assignations_st ' +
                     'LEFT JOIN chantiers ON chantiers.code_chantier=assignations_st.code_chantier ' +
                     'WHERE (semaines.id=assignations_st.id_semaine OR assignations_st.id_semaine IS NULL) ' +
                     'AND ? BETWEEN date_start AND date_end) AS matable ' +
                     'RIGHT JOIN resources_st ON resources_st.id=matable.matricule_resource ' +
                     'WHERE ? BETWEEN semaines.date_start AND semaines.date_end AND resources_st.Actif = 1 ' +
                     'ORDER BY matable.nom_chantier ASC, resources_st.Nom ASC)' +
                     'UNION ' +
                     '(SELECT date_start,date_end,nb_semaine,semaines.id AS id_semaine,' +
                     'matricule_resource AS id,nom_chantier,code_chantier,Conducteur,type_assignation,jour,' +
                     'commentaires,Nom FROM semaines,' +
                     '(SELECT assignations_st_fantome.matricule_resource,id_semaine,chantiers.nom_chantier,' +
                     'chantiers.Conducteur,assignations_st_fantome.code_chantier,assignations_st_fantome.jour,' +
                     'assignations_st_fantome.commentaires,0 AS chef_chantier, "fantome" AS type_assignation, ' +
                     '"SALARIE" AS Type, assignations_st_fantome.nom AS Nom,' +
                     '"3.05-POSEUR" AS Activite, 1 AS Actif ' +
                     'FROM semaines, assignations_st_fantome ' +
                     'LEFT JOIN chantiers ON chantiers.code_chantier=assignations_st_fantome.code_chantier ' +
                     'WHERE (semaines.id=assignations_st_fantome.id_semaine OR assignations_st_fantome.id_semaine IS NULL) ' +
                     'AND ? BETWEEN date_start AND date_end) AS matable_fantome ' +
                     'WHERE ? BETWEEN date_start AND date_end ORDER BY nom_chantier ASC, Nom ASC) ' +
                     'ORDER BY `nom_chantier` DESC, `Nom` ASC ',
                     [req.params.date, req.params.date, req.params.date, req.params.date],
                     function (error, results, fields) {
                         if (error) {
                             log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                             res.json(false)
                         } else
                             res.json(results);
                     })*/


                    bdd.query('(SELECT matable.date_start,matable.date_end,matable.nb_semaine,matable.id_semaine,\n' +
                        'resources_st.id, matable.nom_chantier,matable.code_chantier,Conducteur,"ST" AS type_assignation,\n' +
                        'matable.jour,matable.commentaires,resources_st.Nom \n' +
                        '\n' +
                        'FROM (\n' +
                        '\t\tSELECT semaines.id as id_semaine, semaines.date_start, semaines.date_end, semaines.nb_semaine, assignations_st.matricule_resource, chantiers.nom_chantier,chantiers.Conducteur,\n' +
                        '\t\tassignations_st.code_chantier,assignations_st.jour,assignations_st.commentaires \n' +
                        '\t\tFROM semaines,assignations_st \n' +
                        '\t\tLEFT JOIN chantiers ON chantiers.code_chantier=assignations_st.code_chantier \n' +
                        '\t\tWHERE (semaines.id=assignations_st.id_semaine OR assignations_st.id_semaine IS NULL) \n' +
                        '\t\tAND ? BETWEEN date_start AND date_end\n' +
                        '\t) AS matable \n' +
                        'RIGHT JOIN resources_st ON resources_st.id=matable.matricule_resource \n' +
                        'WHERE ? BETWEEN matable.date_start AND matable.date_end AND resources_st.Actif = 1 \n' +
                        'ORDER BY matable.nom_chantier ASC, resources_st.Nom ASC) ' +
                        'UNION ' +
                        '(SELECT semaines.date_start, semaines.date_end, semaines.nb_semaine, semaines.id AS id_semaine, resources_st.id, \n' +
                        'NULL as nom_chantier, NULL as code_chantier, NULL as Conducteur, "ST" AS type_assignation, NULL as jour, NULL as commentaires, resources_st.Nom\n' +
                        'FROM resources_st, semaines\n' +
                        'WHERE Actif = 1 AND ? BETWEEN semaines.date_start AND semaines.date_end ) ' +
                        'UNION ' +
                        '(SELECT date_start,date_end,nb_semaine,semaines.id AS id_semaine,' +
                        'matricule_resource AS id,nom_chantier,code_chantier,Conducteur,type_assignation,jour,' +
                        'commentaires,Nom FROM semaines,' +
                        '(SELECT assignations_st_fantome.matricule_resource,id_semaine,chantiers.nom_chantier,' +
                        'chantiers.Conducteur,assignations_st_fantome.code_chantier,assignations_st_fantome.jour,' +
                        'assignations_st_fantome.commentaires,0 AS chef_chantier, "fantome" AS type_assignation, ' +
                        '"SALARIE" AS Type, assignations_st_fantome.nom AS Nom,' +
                        '"3.05-POSEUR" AS Activite, 1 AS Actif ' +
                        'FROM semaines, assignations_st_fantome ' +
                        'LEFT JOIN chantiers ON chantiers.code_chantier=assignations_st_fantome.code_chantier ' +
                        'WHERE (semaines.id=assignations_st_fantome.id_semaine OR assignations_st_fantome.id_semaine IS NULL) ' +
                        'AND ? BETWEEN date_start AND date_end) AS matable_fantome ' +
                        'WHERE ? BETWEEN date_start AND date_end ORDER BY nom_chantier ASC, Nom ASC) ' +
                        'ORDER BY `nom_chantier` DESC, `Nom` ASC ',
                        [req.params.date, req.params.date, req.params.date, req.params.date, req.params.date],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //copier coller semaine prec
    app.post('/api/planning_st/copierSem/:matricule/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'special', 'M_CHANTIERS_PLANNING_ST', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;

                    var matricule = req.params.matricule;

                    bdd.query('DELETE FROM assignations_st WHERE id_semaine = ? AND matricule_resource = ?',
                        [semaine, matricule],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                bdd.query('SELECT * FROM assignations_st WHERE id_semaine = ? AND matricule_resource = ?',
                                    [semaineAcopier, matricule],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                            res.json(false)
                                        } else {
                                            var req = 'INSERT INTO assignations_st (matricule_resource,code_chantier,id_semaine,jour, ' +
                                                'activite,commentaires) VALUES '
                                            var args = []
                                            for (let ass of results) {
                                                req += '(?,?,?,?,?,?) ' + (results.indexOf(ass) != results.length - 1 ? ',' : '')
                                                args.push(matricule);
                                                args.push(ass.code_chantier);
                                                args.push(semaine);
                                                args.push(ass.jour);
                                                args.push(ass.activite);
                                                args.push(ass.commentaires);
                                            }
                                            bdd.query(req, args, function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Assignations ST', user.id)
                                                    res.json(false)
                                                } else {
                                                    if (printLogLevel() >= 1) {
                                                        var date = getNBsemaine(printSemaines(), semaine)
                                                        log("Copier les assignations ST de la semaine précédent la semaine " +
                                                            date + " pour le ST " + matricule, 'Assignations ST', user.id)
                                                    }
                                                    res.json(results);
                                                }
                                            })
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

    //Informations sur les assignations_st sans resources
    app.get('/api/planning_st/assignations_st/impression/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('(SELECT semaines.date_start,semaines.date_end,semaines.nb_semaine,semaines.id AS id_semaine,' +
                        'resources_st.id as matricule_resource, matable.nom_chantier,matable.code_chantier,Conducteur,"ST" AS type_assignation, ' +
                        'matable.jour,matable.commentaires,resources_st.Nom FROM semaines,(SELECT semaines.id,' +
                        'assignations_st.matricule_resource, chantiers.nom_chantier,chantiers.Conducteur,' +
                        'assignations_st.code_chantier,assignations_st.jour,assignations_st.commentaires ' +
                        'FROM semaines,assignations_st ' +
                        'LEFT JOIN chantiers ON chantiers.code_chantier=assignations_st.code_chantier ' +
                        'WHERE (semaines.id=assignations_st.id_semaine OR assignations_st.id_semaine IS NULL) ' +
                        'AND ? BETWEEN date_start AND date_end) AS matable ' +
                        'INNER JOIN resources_st ON resources_st.id=matable.matricule_resource ' +
                        'WHERE ? BETWEEN semaines.date_start AND semaines.date_end AND resources_st.Actif = 1 ) ' +
                        'UNION ' +
                        '(SELECT date_start,date_end,nb_semaine,semaines.id AS id_semaine, ' +
                        'matricule_resource,nom_chantier,code_chantier,Conducteur,type_assignation,jour,' +
                        'commentaires,Nom FROM semaines,' +
                        '(SELECT assignations_st_fantome.matricule_resource,id_semaine,chantiers.nom_chantier,' +
                        'chantiers.Conducteur,assignations_st_fantome.code_chantier,assignations_st_fantome.jour,' +
                        'assignations_st_fantome.commentaires,0 AS chef_chantier, "fantome" AS type_assignation,' +
                        '"SALARIE" AS Type, assignations_st_fantome.nom AS Nom,' +
                        '"3.05-POSEUR" AS Activite, 1 AS Actif ' +
                        'FROM semaines, assignations_st_fantome ' +
                        'LEFT JOIN chantiers ON chantiers.code_chantier=assignations_st_fantome.code_chantier ' +
                        'WHERE (semaines.id=assignations_st_fantome.id_semaine OR assignations_st_fantome.id_semaine IS NULL) ' +
                        'AND ? BETWEEN date_start AND date_end) AS matable_fantome ' +
                        'WHERE ? BETWEEN date_start AND date_end) ORDER BY Nom ASC',
                        [req.params.date, req.params.date, req.params.date, req.params.date,],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })

    });

    //liste des code activité
    app.get('/api/planning_st/activites', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('SELECT code,libelle FROM codes_nature  ORDER BY code ASC', function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
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
    app.get('/api/planning_st/noms_chantiers', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('SELECT code_chantier, nom_chantier FROM chantiers ' +
                        'WHERE Actif=1 AND (code_chantier LIKE "CC%" OR code_chantier LIKE "CA%" OR  ' +
                        'code_chantier = "_ATELIER" or code_chantier = "_BUREAUX" or code_chantier = "_TRAVAUX_EPI" or code_chantier = "_EPI_CONSTRUCTION" or code_chantier = "_EPI_MAINTENANCE" or code_chantier = "_MEDECINE" or code_chantier = "_REUNION" or code_chantier = "CPAM CAMBRAI" or code_chantier = "CPAM MAUBEUGE" or code_chantier = "CPAM VALENCIENNES" )' +
                        'ORDER BY nom_chantier ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
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

    //Création assignation
    app.post('/api/planning_st/creation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    //Dans ce code, matricule correspond à l'ID de la resource ST
                    bdd.query('SELECT id FROM assignations_st ' +
                        'WHERE id_semaine = ? AND matricule_resource= ? AND code_chantier= ? AND jour= ? ',
                        [req.body.semaine, req.body.matricule_resource.nom, req.body.code_chantier, req.body.jour],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                // console.log("Données reçues : " + JSON.stringify(req.body, null, 2));
                                res.json(false)
                            } else if (results.length === 0) {
                                bdd.query('INSERT INTO assignations_st (matricule_resource,code_chantier,jour,id_semaine,' +
                                    'commentaires,activite) VALUES (?, ?, ?,?,?,?)',
                                    [req.body.matricule_resource.matricule, req.body.code_chantier, req.body.jour, req.body.semaine,
                                    req.body.comm, req.body.activite], function (error, results2, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                            res.json(false)
                                        } else {
                                            var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                            if (printLogLevel() >= 1)
                                                log('Attribution chantier ' + req.body.code_chantier + ' à ' +
                                                    req.body.matricule_resource + ' le ' + date,
                                                    'Planning Sous-traitant', user.id)
                                            res.json(results2);
                                        }
                                    });
                            } else {
                                res.json('Déjà existant')
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


    app.post('/api/planning_st/creation_fantome', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('SELECT id FROM assignations_st_fantome ' +
                        'WHERE id_semaine = ? AND matricule_resource=? AND code_chantier=? AND jour= ? ',
                        [req.body.semaine, req.body.matricule_resource, req.body.code_chantier, req.body.jour],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            }
                            if (results.length === 0) {
                                bdd.query('INSERT INTO assignations_st_fantome (matricule_resource,code_chantier,jour,' +
                                    'id_semaine,commentaires,nom,activite) VALUES (?,?,?,?,?,?,?)',
                                    [req.body.matricule_resource, req.body.code_chantier, req.body.jour,
                                    req.body.semaine, req.body.comm, req.body.nom, req.body.activite],
                                    function (error, results2, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                            res.json(false)
                                        } else {
                                            var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                            if (printLogLevel() >= 1)
                                                log('Attribution chantier ' + req.body.code_chantier + ' à ' +
                                                    req.body.matricule_resource + ' le ' + date,
                                                    'Planning Sous-traitant', user.id)
                                            res.json(results2);
                                        }
                                    });
                            } else {
                                res.json(false)
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Modifier des assignations_st
    app.put('/api/planning_st/modif', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);


                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    var re = "UPDATE assignations_st SET ";
                    var args = [];
                    console.log("Matricule ressource : " + req.body.matricule_resource)
                    if (req.body.jour != null && req.body.matricule_resource != null) {
                        re += "code_chantier = ? ";
                        args.push(req.body.chantier);
                        re += ", commentaires = ? ";
                        args.push(req.body.comm);

                        re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_chantier=? ";
                        args.push(req.body.matricule_resource.matricule);
                        args.push(req.body.jour);
                        args.push(req.body.semaine);
                        args.push(req.body.ancien_chantier);
                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                if (printLogLevel() >= 1)
                                    log('Modification attribution chantier de ' + req.body.matricule_resource.nom +
                                        ' le ' + date,
                                        'Planning Sous-traitant', user.id)
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

    app.put('/api/planning_st/modif_fantome', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    var re = "UPDATE assignations_st_fantome SET ";
                    var args = [];

                    if (req.body.jour != null && req.body.matricule_resource != null) {
                        re += "code_chantier = ? ";
                        args.push(req.body.chantier);
                        re += ", commentaires = ? ";
                        args.push(req.body.comm);

                        re += "WHERE matricule_resource = ? AND jour= ? AND id_semaine= ? AND code_chantier=? ";
                        args.push(req.body.matricule_resource);
                        args.push(req.body.jour);
                        args.push(req.body.semaine);
                        args.push(req.body.ancien_chantier);
                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getDate(printSemaines(), req.body.semaine, req.body.jour)
                                if (printLogLevel() >= 1)
                                    log('Modification attribution chantier de ' + req.body.matricule_resource +
                                        ' le ' + date,
                                        'Planning Sous-traitant', user.id)
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
    app.delete('/api/planning_st/suppression/:matricule/:semaine/:jour/:comm/:chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('DELETE FROM assignations_st WHERE matricule_resource=? AND code_chantier=? AND jour=? ' +
                        'AND id_semaine=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                if (printLogLevel() >= 1)
                                    log("Suppression d'une attribution chantier à " + req.params.matricule + " le "
                                        + date,
                                        'Planning Sous-traitant', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //suppresssion assignation fantome
    app.delete('/api/planning_st/suppression_fantome/:matricule/:semaine/:jour/:comm/:chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('DELETE FROM assignations_st_fantome WHERE matricule_resource=? AND code_chantier=? AND jour=? ' +
                        'AND id_semaine=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getDate(printSemaines(), req.params.semaine, req.params.jour)
                                if (printLogLevel() >= 1)
                                    log("Suppression d'une attribution chantier à " + req.params.matricule + " le "
                                        + date,
                                        'Planning Sous-traitant', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Suppression assignations_st d'une semaine
    app.delete('/api/planning_st/suppression/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('DELETE FROM assignations_st WHERE id_semaine=?', [req.params.semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
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


    app.post('/api/planning_st/copier_semaine/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query('SELECT code_chantier, matricule_resource, jour, commentaires,activite FROM assignations_st ' +
                        'WHERE id_semaine = ? ORDER BY matricule_resource ASC',
                        [semaineAcopier], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                for (let ass of results) {
                                    const body = {
                                        matricule_resource: ass.matricule_resource,
                                        chantier: ass.code_chantier,
                                        jour: ass.jour,
                                        semaine: semaine,
                                        commentaires: ass.commentaires,
                                        activite: ass.activite
                                    }
                                    bdd.query('INSERT INTO assignations_st (matricule_resource,code_chantier,jour,' +
                                        'id_semaine,commentaires,activite) VALUES (?, ?, ?,?, ?,?)',
                                        [body.matricule_resource, body.chantier, body.jour, body.semaine,
                                        body.commentaires, body.activite], function (error2, results2, fields2) {
                                            if (error2) {
                                                log("Erreur : " + err, 'Planning Sous-Traitant', user.id);
                                                res.send(false);
                                            }
                                        });
                                }
                                var date = getNBsemaine(printSemaines(), req.params.semaine)
                                if (printLogLevel() >= 1)
                                    log('Copie de la semaine précédente sur la semaine ' + date,
                                        'Planning Sous-traitant', user.id)
                            }
                        });
                    res.json(true);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    })
    //Suppression assignations d'une personne sur une semaine
    app.delete('/api/planning_st/suppression/:matricule/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('DELETE FROM assignations_st WHERE id_semaine=? AND matricule_resource =?',
                        [req.params.semaine, req.params.matricule], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getNBsemaine(printSemaines(), req.params.semaine)
                                if (printLogLevel() >= 1)
                                    log('Suppression des attributions de ' + req.params.matricule + ' sur la semaine ' +
                                        date, 'Planning Sous-traitant', user.id)
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
    app.delete('/api/planning_st/suppression_fantome/:matricule/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Sous-Traitant', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_ST', token)) {
                    bdd.query('DELETE FROM assignations_st_fantome WHERE id_semaine=? AND matricule_resource =?',
                        [req.params.semaine, req.params.matricule], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Sous-Traitant', user.id)
                                res.json(false)
                            } else {
                                var date = getNBsemaine(printSemaines(), req.params.semaine)

                                if (printLogLevel() >= 1)
                                    log('Suppression des attributions de ' + req.params.matricule + ' sur la semaine ' +
                                        date, 'Planning Sous-traitant', user.id)
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