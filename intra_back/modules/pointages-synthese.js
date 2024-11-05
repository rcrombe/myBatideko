module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,semaine, querystring, NAV_KEY) {
    const loglevel = printLogLevel();

    app.get('/api/pointages-synthese', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNTHESE', token)) {
                    bdd.query('SELECT DISTINCT S.* FROM semaines S, (SELECT P.date FROM pointages P WHERE P.etat != \'ARCHIVE\' GROUP BY date) as myPointages WHERE myPointages.date BETWEEN S.date_start AND S.date_end ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    app.get('/api/pointages-synthese/resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNTHESE', token)) {
                    bdd.query('SELECT * FROM resources WHERE Actif=1 AND resources.type="SALARIE" ' +
                        'AND (resources.Activite="3.05-POSEUR" OR resources.Activite="3.10-CHEF-EQ" ' +
                        'OR resources.Activite="3.01-APPRENTI" OR resources.Activite="3.15-CHEF-CH" ' +
                        'OR resources.Activite="1.03-PLATRERIE" OR resources.Activite="1.05-PLAFOND")' +
                        'ORDER BY Nom ASC',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    app.get('/api/pointages-synthese/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNTHESE', token)) {
                    var date = req.params.date;

                    bdd.query('SELECT P.*, R.matricule_resource, R.Nom ' +
                        'FROM pointages P, resources R, semaines S ' +
                        'WHERE P.id_mytime_resource = R.id_mytime AND etat != "ARCHIVE" ' +
                        'AND P.date BETWEEN S.date_start AND S.date_end ' +
                        'AND S.id = ? ' +
                        'ORDER BY R.Nom, id_mytime_chantier, P.date_time, action', [req.params.idSemaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                                res.json(false)
                            } else {
                                bdd.query('SELECT * FROM chantiers',
                                    function (error, chantiers, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages', user.id)
                                            res.json(false)
                                        } else {
                                            var answer = [];

                                            results.forEach((el) => {
                                                console.log(el.id_mytime_chantier)
                                                if (el.id_mytime_chantier != null) {
                                                    for (let chantier of chantiers) {
                                                        if (chantier.id_mytime == el.id_mytime_chantier) {
                                                            el.code_chantier = chantier.code_chantier;
                                                            el.nom_chantier = chantier.nom_chantier;
                                                            el.zone_chantier = chantier.zone;
                                                            break;
                                                        }
                                                    }
                                                    answer.push(el);
                                                } else {
                                                    el.code_chantier = null;
                                                    answer.push(el);
                                                }
                                            });

                                            res.json(answer);
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

    app.get('/api/pointages-synthese/vehicules/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNTHESE', token)) {
                    var date = req.params.date;

                    bdd.query('SELECT AV.* ' +
                        'FROM assignations_vehicules AV ' +
                        'WHERE AV.id_semaine = ? ', [req.params.idSemaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    app.get('/api/pointages-synthese/absences/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNTHESE', token)) {
                    var date = req.params.date;

                    bdd.query('SELECT AA.*, A.type ' +
                        'FROM assignations_absence AA, absences A ' +
                        'WHERE AA.id_semaine = ? AND A.code_absence = AA.code_absence ', [req.params.idSemaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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
}