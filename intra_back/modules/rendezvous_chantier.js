module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log, printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

    //Informations sur les assignations
    app.get('/api/rendezvous_chantier/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_RDV', token)) {
                    bdd.query('SELECT * FROM semaines,(SELECT rendezvous_chantier.annule,rendezvous_chantier.commentaires,' +
                        'rendezvous_chantier.heure,' +
                        'rendezvous_chantier.jour,chantiers.nom_chantier,rendezvous_chantier.code_chantier,' +
                        'rendezvous_chantier.matricule_resource FROM semaines,rendezvous_chantier ' +
                        'LEFT JOIN chantiers ON chantiers.code_chantier=rendezvous_chantier.code_chantier ' +
                        'WHERE (semaines.id=rendezvous_chantier.id_semaine OR rendezvous_chantier.id_semaine IS NULL) ' +
                        'AND ? BETWEEN date_start AND date_end) AS matable ' +
                        'RIGHT JOIN resources ON resources.matricule_resource=matable.matricule_resource ' +
                        'WHERE ? BETWEEN date_start AND date_end AND resources.Activite ="4.20-CTX" ' +
                        'AND Actif= 1 ORDER BY resources.Nom ASC, heure',
                        [req.params.date, req.params.date], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
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

    app.post('/api/rendezvous_chantier/creation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_RDV', token)) {
                    bdd.query('INSERT INTO rendezvous_chantier (matricule_resource, code_chantier, jour,id_semaine,' +
                        'heure,commentaires,annule) VALUES (?, ?, ?,?,?,?,?)',
                        [req.body.matricule_resource, req.body.code_chantier, req.body.jour, req.body.id_semaine,
                            req.body.heure, req.body.commentaires, req.body.annule],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getDate(printSemaines(), req.body.id_semaine, req.body.jour)
                                    log("Ajout d'un rendez-vous chantier pour " + req.body.matricule_resource +
                                        " sur le chantier " + req.body.code_chantier + ' à ' + req.body.heure +
                                        ' le ' + date, 'Rendez-Vous Chantier', user.id)
                                }
                                res.json(results);
                            }
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });

    //copier coller semaine prec
    app.post('/api/rendezvous_chantier/copierSem/:matricule/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_RDV', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;

                    var matricule = req.params.matricule;
                    const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);

                    bdd.query('DELETE FROM rendezvous_chantier WHERE id_semaine = ? AND matricule_resource = ?',
                        [semaine, matricule],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                bdd.query('SELECT * FROM rendezvous_chantier WHERE id_semaine = ? AND matricule_resource = ?',
                                    [semaineAcopier, matricule],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                            res.json(false)
                                        } else {
                                            var req = 'INSERT INTO rendezvous_chantier (matricule_resource,id_semaine,jour, ' +
                                                'heure,code_chantier,commentaires, annule) VALUES '
                                            var args = []
                                            for (let ass of results) {
                                                req += '(?,?,?,?,?,?,?) ' + (results.indexOf(ass) != results.length - 1 ? ',' : '')
                                                args.push(matricule);
                                                args.push(semaine);
                                                args.push(ass.jour);
                                                args.push(ass.heure);
                                                args.push(ass.code_chantier);
                                                args.push(ass.commentaires);
                                                args.push(ass.annule);
                                            }
                                            bdd.query(req, args, function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                                    res.json(false)
                                                } else {
                                                    if (printLogLevel() >= 1) {
                                                        var date = getNBsemaine(printSemaines(), semaine)
                                                        log("Copier les rendez-vous chantier de la semaine précédent la semaine " +
                                                            date + " pour la ressource matricule " + matricule, 'Rendez-Vous Chantier', user.id)
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

    //Supression rendezvous_chantier
    app.delete('/api/rendezvous_chantier/supression/:matricule/:semaine/:jour/:chantier/:heure', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_RDV', token)) {
                    bdd.query('DELETE FROM rendezvous_chantier WHERE matricule_resource=? AND code_chantier=? ' +
                        'AND jour=? AND id_semaine=? AND heure=?',
                        [req.params.matricule, req.params.chantier, req.params.jour, req.params.semaine, req.params.heure],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getNBsemaine(printSemaines(), req.params.semaine)
                                    log("Suppression du rendez-vous chantier pour " + req.params.matricule +
                                        " sur le chantier " + req.params.chantier + ' à' + req.params.heure +
                                        ' le ' + date + ' de la semaine '
                                        + req.params.semaine, 'Rendez-Vous Chantier', user.id)
                                }
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //Supression rendezvous_chantier sur une semaine
    app.delete('/api/rendezvous_chantier/supression_semaine/:matricule/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_RDV', token)) {
                    bdd.query('DELETE FROM rendezvous_chantier WHERE matricule_resource=? AND id_semaine=? ',
                        [req.params.matricule, req.params.semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    var date = getNBsemaine(printSemaines(), req.params.semaine)
                                log("Suppression des rendez-vous chantier de " + req.params.matricule + " sur la semaine " +
                                    date, 'Rendez-Vous Chantier', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //Modifier un rendez vous
    app.put('/api/rendezvous_chantier/modifier_rdv', function (req, res) {
        console.log('HELLO AGAIN');

        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);
                console.log("HELLO")

                if(SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_RDV', token)) {

                    var re = "UPDATE rendezvous_chantier SET ";
                    var args = [];

                    console.log(req.body)

                    if (req.body.code_chantier !== '' && req.body.heure !== '' && req.body.annule !== '') {
                        re += "code_chantier = ?";
                        args.push(req.body.code_chantier);
                        re += ",heure = ?";
                        args.push(req.body.heure);
                        re += ",commentaires = ?";
                        args.push(req.body.commentaires);
                        re += ",annule = ? ";
                        args.push(req.body.annule);
                        re += "WHERE matricule_resource = ? AND id_semaine= ? AND jour=? AND code_chantier=? AND annule = ?";
                        args.push(req.body.matricule_resource);
                        args.push(req.body.semaine);
                        args.push(req.body.jour);
                        args.push(req.body.old_code_chantier);
                        args.push(req.body.old_annule);
                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getNBsemaine(printSemaines(), req.body.semaine)
                                    log("Modification de l'heure(" + req.body.heure + ") et/ou du chantier(" +
                                        req.body.code_chantier + ") du rendez-vous sur chantier de " +
                                        req.body.matricule_resource + " le " + date +
                                        " de la semaine " + req.body.semaine, 'Rendez-Vous Chantier', user.id)
                                }
                                res.json(true);
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
}