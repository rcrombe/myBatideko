module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request, log,printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

    //stats par semaine
    app.get('/api/home/vehicules_actifs/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    bdd.query('SELECT vehicules_actifs.nb_vehicules/total_vehicules.nb_vehicules AS veh_actifs FROM ' +
                        '(SELECT COUNT(aide.immatriculation) AS nb_vehicules ' +
                        'FROM (SELECT DISTINCT immatriculation ,semaines.nb_semaine ' +
                        'FROM assignations_vehicules LEFT JOIN semaines ON semaines.id= assignations_vehicules.id_semaine ' +
                        'WHERE ? BETWEEN date_start AND date_end )AS aide )AS vehicules_actifs , ' +
                        '(SELECT COUNT(DISTINCT immatriculation) AS nb_vehicules FROM vehicules WHERE dispo = 1 AND bureaux = 0)  AS total_vehicules',
                        [req.params.dateFormate],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Tableau de bord', user.id)
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

    app.get('/api/home/activite/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {

                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT COUNT(Activite)/5 AS nb_activite,activite, nb_semaine ,libelle \n' +
                            'FROM (SELECT activite ,semaines.nb_semaine \n' +
                            'FROM assignations, chantiers, semaines  \n' +
                            'WHERE semaines.id= assignations.id_semaine AND assignations.code_chantier = chantiers.code_chantier AND chantiers.Conducteur = ? AND ? BETWEEN date_start AND date_end  ) \n' +
                            'AS activites INNER JOIN codes_nature ON codes_nature.code=activite \n' +
                            'GROUP BY nb_semaine, Activite', [user.nav_id, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT COUNT(Activite)/5 AS nb_activite,activite, nb_semaine ,libelle ' +
                            'FROM (SELECT activite ,semaines.nb_semaine ' +
                            'FROM assignations LEFT JOIN semaines ON semaines.id= assignations.id_semaine ' +
                            'WHERE ? BETWEEN date_start AND date_end ) ' +
                            'AS activites INNER JOIN codes_nature ON codes_nature.code=activite ' +
                            'GROUP BY nb_semaine, Activite', [req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });

    app.get('/api/home/type/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {

                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT COUNT(Type) AS nb_types,Type, nb_semaine FROM \n' +
                            '                    (SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine FROM assignations \n' +
                            '                    INNER JOIN semaines ON semaines.id=assignations.id_semaine \n' +
                            '                    INNER JOIN resources ON resources.matricule_resource=assignations.matricule_resource \n' +
                            '                     INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier\n' +
                            '                    WHERE chantiers.Conducteur = ? AND ? BETWEEN date_start AND date_end ) AS types \n' +
                            '                    GROUP BY nb_semaine, Type UNION \n' +
                            '                    SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine FROM \n' +
                            '                    (SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine FROM assignations_st \n' +
                            '                    INNER JOIN semaines ON semaines.id=assignations_st.id_semaine \n' +
                            '                    INNER JOIN resources_st ON resources_st.id=assignations_st.matricule_resource \n' +
                            '                     INNER JOIN chantiers ON chantiers.code_chantier = assignations_st.code_chantier\n' +
                            '                    WHERE chantiers.Conducteur = ? AND ? BETWEEN date_start AND date_end) \n' +
                            '                    AS st GROUP BY st.nb_semaine', [user.nav_id, req.params.dateFormate, user.nav_id, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT COUNT(Type) AS nb_types,Type, nb_semaine FROM ' +
                            '(SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine FROM assignations ' +
                            'INNER JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            'INNER JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                            'WHERE ? BETWEEN date_start AND date_end ) AS types ' +
                            'GROUP BY nb_semaine, Type UNION ' +
                            'SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine FROM ' +
                            '(SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine FROM assignations_st ' +
                            'INNER JOIN semaines ON semaines.id=assignations_st.id_semaine ' +
                            'INNER JOIN resources_st ON resources_st.id=assignations_st.matricule_resource ' +
                            'WHERE ? BETWEEN date_start AND date_end) ' +
                            'AS st GROUP BY st.nb_semaine', [req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //stats par mois
    app.get('/api/home-mois/vehicules_actifs/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    bdd.query('SELECT vehicules_actifs.nb_vehicules/total_vehicules.nb_vehicules AS proportion,nb_semaine FROM ' +
                        '(SELECT COUNT(aide.immatriculation) AS nb_vehicules,nb_semaine FROM ' +
                        '(SELECT DISTINCT immatriculation ,semaines.nb_semaine ' +
                        'FROM assignations_vehicules RIGHT JOIN semaines ON semaines.id= assignations_vehicules.id_semaine ' +
                        'WHERE (MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) ' +
                        'OR (MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?)) ) ' +
                        'AS aide GROUP BY nb_semaine) AS vehicules_actifs , ' +
                        '(SELECT COUNT(DISTINCT immatriculation) AS nb_vehicules FROM vehicules WHERE dispo = 1 AND bureaux = 0)  AS total_vehicules',
                        [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Tableau de bord', user.id)
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

    app.get('/api/home-mois/activite/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT COUNT(Activite)/5 AS nb_activite,Activite, nb_semaine,libelle ' +
                            'FROM (SELECT activite ,semaines.nb_semaine ' +
                            'FROM assignations ' +
                            'RIGHT JOIN semaines ON semaines.id= assignations.id_semaine ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier ' +
                            'WHERE ((MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) ' +
                            'OR (MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?))) AND chantiers.Conducteur = ? ) ' +
                            'AS activites LEFT JOIN codes_nature ON codes_nature.code=activite' +
                            ' GROUP BY nb_semaine, Activite ORDER BY nb_semaine ASC',
                            [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, user.nav_id],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT COUNT(Activite)/5 AS nb_activite,Activite, nb_semaine,libelle ' +
                            'FROM (SELECT activite ,semaines.nb_semaine ' +
                            'FROM assignations RIGHT JOIN semaines ON semaines.id= assignations.id_semaine ' +
                            'WHERE (MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) ' +
                            'OR (MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?)) ) ' +
                            'AS activites LEFT JOIN codes_nature ON codes_nature.code=activite' +
                            ' GROUP BY nb_semaine, Activite ORDER BY nb_semaine ASC',
                            [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/home-mois/type/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT COUNT(Type) AS nb_types,Type, nb_semaine FROM ' +
                            '(SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine FROM assignations ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            'LEFT JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier ' +
                            'WHERE ((MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) ' +
                            'OR (MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?))) AND chantiers.Conducteur = ? ) AS types ' +
                            'GROUP BY nb_semaine, Type ' +
                            'UNION ' +
                            'SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine FROM ' +
                            '(SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine FROM assignations_st ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations_st.id_semaine ' +
                            'LEFT JOIN resources_st ON resources_st.id=assignations_st.matricule_resource ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations_st.code_chantier ' +
                            'WHERE ((MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) OR ' +
                            '(MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?))) AND chantiers.Conducteur = ? ) AS st  ' +
                            'GROUP BY st.nb_semaine ORDER BY nb_semaine ASC ',
                            [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, user.nav_id,
                                req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, user.nav_id],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT COUNT(Type) AS nb_types,Type, nb_semaine FROM ' +
                            '(SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine FROM assignations ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            'LEFT JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                            'WHERE (MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) ' +
                            'OR (MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?)) ) AS types ' +
                            'GROUP BY nb_semaine, Type UNION ' +
                            'SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine FROM ' +
                            '(SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine FROM assignations_st ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations_st.id_semaine ' +
                            'LEFT JOIN resources_st ON resources_st.id=assignations_st.matricule_resource ' +
                            'WHERE (MONTH(date_start)=MONTH(?)  AND YEAR(date_start)=YEAR(?)) OR ' +
                            '(MONTH(DATE_SUB(date_end, INTERVAL 2 DAY))=MONTH(?)  AND YEAR(date_end)=YEAR(?)) ) AS st  ' +
                            'GROUP BY st.nb_semaine ORDER BY nb_semaine ASC ',
                            [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate,
                                req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //stats par an
    app.get('/api/home-annee/vehicules_actifs/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    bdd.query('SELECT AVG(proportion) AS proportion, nb_mois FROM' +
                        '(SELECT vehicules_actifs.nb_vehicules/total_vehicules.nb_vehicules AS proportion,nb_semaine, nb_mois FROM ' +
                        '(SELECT COUNT(aide.immatriculation) AS nb_vehicules,nb_semaine, nb_mois FROM ' +
                        '(SELECT DISTINCT immatriculation ,semaines.nb_semaine, MONTH(date_start) AS nb_mois ' +
                        'FROM assignations_vehicules RIGHT JOIN semaines ON semaines.id= assignations_vehicules.id_semaine ' +
                        'WHERE YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?) ) ' +
                        'AS aide GROUP BY nb_semaine, nb_mois) AS vehicules_actifs , ' +
                        '(SELECT COUNT(DISTINCT immatriculation) AS nb_vehicules FROM vehicules WHERE dispo = 1 AND bureaux = 0)  AS total_vehicules) AS proportions' +
                        ' GROUP BY nb_mois ORDER BY nb_mois ASC ',
                        [req.params.dateFormate, req.params.dateFormate],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Tableau de bord', user.id)
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

    app.get('/api/home-annee/activite/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {
                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT nbr_activites / nbr_jours AS nb_activite, mois, Activite, libelle FROM' +
                            '(SELECT COUNT(activite) AS nbr_activites, mois, nbr_jours, activite FROM ' +
                            '(SELECT activite , MONTH(ADDDATE(date_start, INTERVAL jour DAY)) AS mois,' +
                            'DAY(LAST_DAY(ADDDATE(date_start, INTERVAL jour DAY))) AS nbr_jours ' +
                            'FROM assignations ' +
                            'RIGHT JOIN semaines ON semaines.id= assignations.id_semaine ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier ' +
                            'WHERE (YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?)) AND chantiers.Conducteur = ? ) AS activites ' +
                            'LEFT JOIN codes_nature ON codes_nature.code=activite ' +
                            'GROUP BY mois,activite,nbr_jours) AS compte LEFT JOIN codes_nature ON codes_nature.code=activite',
                            [req.params.dateFormate, req.params.dateFormate, user.nav_id],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT nbr_activites / nbr_jours AS nb_activite, mois, Activite, libelle FROM' +
                            '(SELECT COUNT(activite) AS nbr_activites, mois, nbr_jours, activite FROM ' +
                            '(SELECT activite , MONTH(ADDDATE(date_start, INTERVAL jour DAY)) AS mois,' +
                            'DAY(LAST_DAY(ADDDATE(date_start, INTERVAL jour DAY))) AS nbr_jours ' +
                            'FROM assignations RIGHT JOIN semaines ON semaines.id= assignations.id_semaine ' +
                            'WHERE YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?)) AS activites ' +
                            'LEFT JOIN codes_nature ON codes_nature.code=activite ' +
                            'GROUP BY mois,activite,nbr_jours) AS compte LEFT JOIN codes_nature ON codes_nature.code=activite',
                            [req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/home-annee/type/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {

                    if (req.params.dataType == 'perso') {
                        bdd.query('SELECT AVG(nb_types) AS nb_types, Type, nb_mois FROM' +
                            '(SELECT COUNT(Type) AS nb_types,Type, nb_semaine, nb_mois FROM ' +
                            '(SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine, MONTH(date_start) AS nb_mois FROM assignations ' +
                            'INNER JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier ' +
                            'WHERE (YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?)) AND chantiers.Conducteur = ? ) AS types ' +
                            'GROUP BY nb_semaine, Type, nb_mois) AS table1 GROUP BY nb_mois, Type ' +
                            'UNION ' +
                            'SELECT AVG(nb_types), "SOUS TRAITANT", nb_mois FROM' +
                            '(SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine, nb_mois FROM ' +
                            '(SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine, MONTH(date_start) AS nb_mois' +
                            ' FROM assignations_st INNER JOIN resources_st ON resources_st.id=assignations_st.matricule_resource ' +
                            ' RIGHT JOIN semaines ON semaines.id=assignations_st.id_semaine ' +
                            'INNER JOIN chantiers ON chantiers.code_chantier = assignations_st.code_chantier ' +
                            'WHERE (YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?)) AND chantiers.Conducteur = ? ) AS st  ' +
                            'GROUP BY st.nb_semaine, nb_mois) AS salut GROUP BY nb_mois ORDER BY nb_mois  ',
                            [req.params.dateFormate, req.params.dateFormate, user.nav_id, req.params.dateFormate, req.params.dateFormate, user.nav_id],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT AVG(nb_types) AS nb_types, Type, nb_mois FROM' +
                            '(SELECT COUNT(Type) AS nb_types,Type, nb_semaine, nb_mois FROM ' +
                            '(SELECT DISTINCT resources.matricule_resource, Type, semaines.nb_semaine, MONTH(date_start) AS nb_mois FROM assignations ' +
                            'INNER JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                            'RIGHT JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            'WHERE YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?) ) AS types ' +
                            'GROUP BY nb_semaine, Type, nb_mois) AS table1 GROUP BY nb_mois, Type ' +
                            'UNION ' +
                            'SELECT AVG(nb_types), "SOUS TRAITANT", nb_mois FROM' +
                            '(SELECT COUNT(matricule_resource) AS nb_types, "SOUS TRAITANT" , nb_semaine, nb_mois FROM ' +
                            '(SELECT DISTINCT resources_st.code AS matricule_resource, semaines.nb_semaine, MONTH(date_start) AS nb_mois' +
                            ' FROM assignations_st INNER JOIN resources_st ON resources_st.id=assignations_st.matricule_resource ' +
                            ' RIGHT JOIN semaines ON semaines.id=assignations_st.id_semaine ' +
                            'WHERE YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?) ) AS st  ' +
                            'GROUP BY st.nb_semaine, nb_mois) AS salut GROUP BY nb_mois ORDER BY nb_mois  ',
                            [req.params.dateFormate, req.params.dateFormate, req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/home-annee/chantiers/:dataType/:dateFormate', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Tableau de bord', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_DASHBOARD', token)) {

                    if (req.params.dataType == 'perso') {

                        bdd.query('SELECT COUNT(code_chantier) AS nb_chantiers, nb_mois FROM ' +
                            ' (SELECT DISTINCT assignations.code_chantier, MONTH(date_start) AS nb_mois FROM assignations ' +
                            ' INNER JOIN semaines ON semaines.id=assignations.id_semaine' +
                            ' INNER JOIN chantiers ON chantiers.code_chantier = assignations.code_chantier ' +
                            ' WHERE (YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?)) AND chantiers.Conducteur = ? ) AS chantiers ' +
                            ' GROUP BY nb_mois  ',
                            [req.params.dateFormate, req.params.dateFormate, user.nav_id],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    } else {
                        bdd.query('SELECT COUNT(code_chantier) AS nb_chantiers, nb_mois FROM ' +
                            ' (SELECT DISTINCT code_chantier, MONTH(date_start) AS nb_mois FROM assignations ' +
                            ' INNER JOIN semaines ON semaines.id=assignations.id_semaine ' +
                            ' WHERE YEAR(date_start)=YEAR(?) OR YEAR(date_end)=YEAR(?) ) AS chantiers ' +
                            ' GROUP BY nb_mois  ',
                            [req.params.dateFormate, req.params.dateFormate],
                            function (error, results, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Tableau de bord', user.id)
                                    res.json(false)
                                } else
                                    res.json(results);
                            });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });

    });
}