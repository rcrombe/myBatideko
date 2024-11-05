module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request, log, printLogLevel, printSemaines,
    getNBsemaine, getDate) {

    //semaine actuelle id et numéro
    app.get('/api/planning_atelier/temps/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_A', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT nb_semaine, id, date_start, date_end FROM semaines " +
                        "WHERE date_start LIKE '" + date + "%' OR DATE_SUB(date_end, INTERVAL 2 DAY) LIKE '" + date + "%' ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Atelier', user.id)
                                res.json(false)
                            } else {
                                if (results.length > 1) {
                                    bdd.query("SELECT * FROM atelier_statuts ",
                                        function (error, results1, fields) {
                                            if (error) {
                                                log("Erreur : " + error, 'Planning Atelier', user.id)
                                                res.json(false)
                                            } else {
                                                if (results1.length > 0) {
                                                    var listDates = new Array();
                                                    var date = new Date(results[0].date_start);
                                                    var date_end = new Date(results[results.length - 1].date_end);
                                                    var dateIncremental = new Date(results[0].date_start)
                                                    var semaine = 0;
                                                    var jour = 0;
                                                    listDates.push({
                                                        date: new Date(dateIncremental),
                                                        jour: jour,
                                                        semaine: semaine,
                                                        dateStart: results[0].date_start,
                                                        dateEnd: results[results.length - 1].date_end,
                                                    });
                                                    jour++
                                                    date.setDate(date.getDate() + 1);
                                                    while (date.getTime() != date_end.getTime()) {
                                                        listDates.push({
                                                            date: new Date(dateIncremental.setDate(dateIncremental.getDate() + 1)),
                                                            jour: jour,
                                                            semaine: semaine,
                                                            dateStart: results[0].date_start,
                                                            dateEnd: results[results.length - 1].date_end,
                                                        });
                                                        date.setDate(date.getDate() + 1);
                                                        if (jour === 6) {
                                                            jour = 0;
                                                            semaine += 1;
                                                        } else
                                                            jour += 1;
                                                    }

                                                    listDates.push({
                                                        date: date,
                                                        jour: jour,
                                                        semaine: semaine,
                                                        dateStart: results[0].date_start,
                                                        dateEnd: results[results.length - 1].date_end,
                                                    });

                                                    var listMonth = [];

                                                    for (let week = 0; week < results.length; week++) {
                                                        listMonth.push(results[week].id);
                                                    }
                                                    const body1 = {
                                                        listMonth: listMonth,
                                                        listDates: listDates,
                                                        results: results,
                                                        statuts: results1
                                                    }

                                                    //console.log()

                                                    res.json(JSON.stringify(body1));
                                                } else
                                                    res.json(false);
                                            }
                                        });
                                } else
                                    res.json(false);


                            }

                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //liste assignaitons absences et resources
    app.post('/api/planning_atelier/assignations', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_PLANNING_A', token)) {


                    const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    try {
                        var jData = JSON.parse(req.body.listMonth);
                        var obj = JSON.parse(req.body.results);
                        var statuts = JSON.parse(req.body.statuts);
                    } catch (e) {
                        console.log("Invalid data received : " + req.body.listMonth);
                        console.log("Invalid data received : " + req.body.results);
                        console.log("Invalid data received : " + req.body.statuts);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var request = '(SELECT assignations.nom_chantier,assignations.jour, assignations.id ,' +
                        'assignations.id_chantier_ouvrage,assignations.nom , assignations.atelier_statut, assignations.code_chantier, assignations.Conducteur,assignations.duree_prevue  FROM (SELECT semaines.id, ' +
                        'chantiers_atelier.id as id_chantier_ouvrage, chantiers_atelier.code_chantier, chantiers_atelier.nom, chantiers_atelier.duree_prevue, chantiers_atelier.commentaire, chantiers.Conducteur, chantiers.nom_chantier,' +
                        'assignations_atelier.jour,assignations_atelier.chantier_atelier, assignations_atelier.atelier_statut FROM assignations_atelier ' +
                        'INNER JOIN semaines ON semaines.id= assignations_atelier.id_semaine ' +
                        'INNER JOIN chantiers_atelier ON chantiers_atelier.id= assignations_atelier.chantier_atelier ' +
                        'INNER JOIN chantiers ON chantiers.code_chantier=chantiers_atelier.code_chantier ' +
                        'WHERE ( ' //
                    var args = []

                    var i = 0
                    jData.forEach((el) => {
                        i++
                        request += 'semaines.id =? ' + (i < jData.length ? "OR " : "")
                        args.push(el)
                    })
                    request += ')' +
                        'UNION\n' +
                        'SELECT NULL as id, chantiers_atelier.id as id_chantier_ouvrage, chantiers_atelier.code_chantier, \n' +
                        'chantiers_atelier.nom, chantiers_atelier.duree_prevue, chantiers_atelier.commentaire, chantiers.Conducteur, chantiers.nom_chantier, NULL as jour,NULL as chantier_atelier, NULL as atelier_statut \n' +
                        'FROM chantiers_atelier \n' +
                        'INNER JOIN chantiers ON chantiers.code_chantier=chantiers_atelier.code_chantier \n' +
                        'WHERE chantiers_atelier.Actif = 1' +
                        ') AS assignations ORDER BY assignations.nom ASC)'

                    bdd.query(request, args,
                        (error, results, fields) => {
                            if (error) {
                                log("Erreur : " + error, 'Planning Atelier', user.id)
                                res.json(false)
                            } else {
                                var assignations_atelier = [];

                                for (let el of results) {
                                    if (el.atelier_statut !== null) {
                                        var week = el.id - obj[0].id;
                                        var pos = statuts.findIndex(i => i.id === el.atelier_statut);

                                        var body = {
                                            statut: el.atelier_statut,
                                            description: statuts[pos].libelle,
                                            couleur: statuts[pos].color
                                        }
                                        if (assignations_atelier.findIndex(i => i.id_chantier_ouvrage === el.id_chantier_ouvrage) !== -1) {
                                            var index = assignations_atelier.findIndex(i => i.id_chantier_ouvrage === el.id_chantier_ouvrage);

                                            assignations_atelier[assignations_atelier.length - 1].mois[week][el.jour] = body;
                                        } else {
                                            var t_obj = {
                                                id_chantier_ouvrage: el.id_chantier_ouvrage,
                                                nom: el.nom,
                                                code_chantier: el.code_chantier,
                                                nom_chantier: el.nom_chantier,
                                                Conducteur: el.Conducteur,
                                                duree_prevue: el.duree_prevue,
                                                mois: []
                                            }

                                            for (var i = 0; i < jData.length; i++)
                                                t_obj.mois.push([{}, {}, {}, {}, {}, {}, {}]);

                                            assignations_atelier.push(t_obj);

                                            if (el.atelier_statut !== null) {
                                                assignations_atelier[assignations_atelier.length - 1].mois[week][el.jour] = body;
                                            }
                                        }
                                    } else {
                                        if (assignations_atelier.findIndex(i => i.id_chantier_ouvrage === el.id_chantier_ouvrage) === -1) {
                                            var t_obj = {
                                                id_chantier_ouvrage: el.id_chantier_ouvrage,
                                                nom: el.nom,
                                                code_chantier: el.code_chantier,
                                                nom_chantier: el.nom_chantier,
                                                Conducteur: el.Conducteur,
                                                duree_prevue: el.duree_prevue,
                                                mois: []
                                            }

                                            for (var i = 0; i < jData.length; i++)
                                                t_obj.mois.push([{}, {}, {}, {}, {}, {}, {}]);

                                            assignations_atelier.push(t_obj);
                                        }
                                    }
                                }

                                //console.log(JSON.stringify(assignations_atelier))
                                res.json(JSON.stringify(assignations_atelier));
                            }
                        })
                }
                else {
                    res.json('SECURITY_ERROR');
                }
            }
        })
    });

    //creation assignation absence
    app.post('/api/planning_atelier/attribution_statut', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Atelier', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_A', token)) {
                    try {
                        var jData = JSON.parse(req.body.listAttributions);
                    } catch (e) {
                        console.log("Invalid data received : " + req.body.listAttributions);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var req_del = "DELETE FROM assignations_atelier WHERE ";
                    var req_insert = "INSERT INTO assignations_atelier (chantier_atelier, atelier_statut, id_semaine, jour) VALUES ";

                    var where = "1=0 ";
                    var args_del = [];
                    var args_insert = [];


                    var i = 0;
                    jData.forEach((el) => {
                        i++;
                        var isOk = true;

                        if (typeof el.id_chantier_ouvrage === 'undefined' || el.id_chantier_ouvrage === '' || el.id_chantier_ouvrage === null) {
                            console.log("Matricule invalide");
                            isOk = false;
                        }
                        if (typeof el.jour === 'undefined' || el.jour.length === '' || el.jour === null) {
                            console.log("Jour invalide");
                            isOk = false;
                        }
                        if (typeof el.semaine === 'undefined' || el.semaine === '' || el.semaine === null) {
                            console.log("Semaine invalide");
                            isOk = false;
                        }
                        if (typeof el.statut === 'undefined' || el.statut === '' || el.statut === null) {
                            console.log("Code absence invalide");
                            isOk = false;
                        }

                        if (!isOk) {
                            console.log("Invalid data received : " + req.body.listAttributions);
                            res.json("INVALID_DATA");
                            return;
                        }
                        where += "OR (chantier_atelier = ? AND id_semaine = ? AND jour = ?) ";
                        args_del.push(el.id_chantier_ouvrage);
                        args_del.push(el.semaine);
                        args_del.push(el.jour);


                        req_insert += "(?,?,?,?)" + (i < jData.length ? ", " : "");
                        args_insert.push(el.id_chantier_ouvrage);
                        args_insert.push(el.statut);
                        args_insert.push(el.semaine);
                        args_insert.push(el.jour);

                    });

                    req_del = req_del + where + " ; DELETE FROM assignations_atelier WHERE " + where;
                    var req_args_del = args_del.concat(args_del);


                    bdd.query(req_del, req_args_del, (error, results, files) => {
                        if (error) {
                            log("Erreur : " + error, 'Planning Atelier', user.id)
                            res.json(false)
                        } else {
                            bdd.query(req_insert, args_insert, (error, results, files) => {
                                if (error) {
                                    log("Erreur : " + error, 'Planning Atelier', user.id)
                                    res.json(false)
                                } else {
                                    if (printLogLevel() >= 1) {
                                        jData.forEach((el) => {
                                            var date = getDate(printSemaines(), el.semaine, el.jour)
                                            log("Ajout atelier " + el.id_chantier_ouvrage + ' à statut ' + el.statut + ' le ' +
                                                date, 'Planning Absences', user.id)
                                        })
                                    }
                                    res.json("OK");
                                }

                            });
                        }

                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    app.post('/api/planning_atelier/supression_assignation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_CHANTIERS_PLANNING_A', token)) {
                    try {
                        var jData = JSON.parse(req.body.listDelete);

                    } catch (e) {
                        console.log("Invalid data received ici : " + req.body.listAttributions);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var req_del = "DELETE FROM assignations_atelier WHERE ";

                    var where = "1=0 ";
                    var args_del = [];

                    var i = 0;
                    jData.forEach((el) => {
                        i++;
                        var isOk = true;

                        if (typeof el.id_chantier_ouvrage === 'undefined' || el.id_chantier_ouvrage === '' || el.id_chantier_ouvrage === null) {
                            console.log("Matricule invalide");
                            isOk = false;
                        }
                        if (typeof el.jour === 'undefined' || el.jour.length === '' || el.jour === null) {
                            console.log("Jour invalide");
                            isOk = false;
                        }
                        if (typeof el.semaine === 'undefined' || el.semaine === '' || el.semaine === null) {
                            console.log("Semaine invalide");
                            isOk = false;
                        }

                        if (!isOk) {
                            console.log("Invalid data received : " + req.body.listAttributions);
                            res.json("INVALID_DATA");
                            return;
                        }
                        where += "OR (chantier_atelier = ? AND id_semaine = ? AND jour = ? ) ";
                        args_del.push(el.id_chantier_ouvrage);
                        args_del.push(el.semaine);
                        args_del.push(el.jour);

                    });

                    req_del = req_del + where

                    bdd.query(req_del, args_del,
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Atelier', user.id)
                                res.json(false)
                            } else {
                                jData.forEach((el) => {
                                    if (printLogLevel() >= 1) {
                                        var date = getDate(printSemaines(), el.semaine, el.jour)
                                        log("Suppression planning atelier " + el.id_chantier_ouvrage + ' le ' + date,
                                            'Planning Atelier', user.id)
                                    }
                                })
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //obtenir les absences
    app.get('/api/gestion_atelier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Statut', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_GESTION_ATELIER', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT * FROM atelier_statuts ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Statut', user.id)
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

    app.post('/api/gestion_atelier/creation_statut', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Atelier', null)
                res.send(false)
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_ATELIER', token)) {
                    bdd.query('INSERT INTO atelier_statuts (libelle, color) ' +
                        'VALUES (?, ?)',
                        [req.body.libelle, req.body.color],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Atelier', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Ajout d'un statut : " + req.body.libelle, 'Gestion Atelier', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //modifierla couleur d'une absence
    app.put('/api/gestion_atelier/modifColor', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Atelier', null)
                res.send(false)
            }
            else if (req.body.id === null || req.body.id === '')
                res.json(false)
            else {

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_ATELIER', token)) {
                    var re = "UPDATE atelier_statuts SET ";
                    var args = [];
                    re += "color = ? ";
                    args.push(req.body.color);

                    re += "WHERE id = ? ";
                    args.push(req.body.id);

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Atelier', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification du code couleur du statut : " + req.body.libelle, 'Gestion Atelier', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //supprimer une absence
    app.delete('/api/gestion_atelier/supression/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Atelier', null)
                res.send(false)
            }

            const token = req.headers.authorization.split(' ')[1];
            const user = jsonWebToken.decode(token);

            if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_ATELIER', token)) {
                bdd.query('DELETE FROM atelier_statuts WHERE id=?',
                    [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Atelier', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Suppression d'un statut : " + req.params.id, 'Gestion Atelier', user.id)

                            res.json(results);
                        }
                    });
            }
            else
                res.json('SECURITY_ERROR');


        })
    })


    ////// GESTION OUVRAGES ///////

    //obtenir les absences
    app.get('/api/gestion_ouvrages', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ouvrages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_GESTION_OUVRAGES', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query(`
                        SELECT C.code_chantier, 
                            CA.nom AS nom_ouvrage, 
                            CA.id AS id_ouvrage, 
                            nom_chantier, 
                            CA.Actif, 
                            CA.duree_prevue, 
                            CA.commentaire,
                            COALESCE((SELECT SUM(duree) 
                                FROM pointages_atelier_lignes 
                                WHERE code_ouvrage = CA.id),0) AS duree_totale
                        FROM chantiers_atelier CA
                        JOIN chantiers C ON C.code_chantier = CA.code_chantier
                        ORDER BY CA.id DESC`,
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Ouvrages', user.id)
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

    app.post('/api/gestion_ouvrages/creation_ouvrage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ouvrages', null)
                res.send(false)
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (req.body.code_chantier === null || req.body.code_chantier === ''
                    || req.body.nom_ouvrage === null || req.body.nom_ouvrage === ''
                    || req.body.duree_prevue === null || req.body.duree_prevue === ''
                )
                    res.json(false)
                else if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_OUVRAGES', token)) {
                    var duree = req.body.duree_prevue.split(':');
                    var d = duree[0] * 3600 + duree[1] * 60;


                    bdd.query('INSERT INTO chantiers_atelier (code_chantier, nom, duree_prevue) ' +
                        'VALUES (?, ?, ?)',
                        [req.body.code_chantier, req.body.nom_ouvrage, d],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Ouvrages', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Ajout d'un statut : " + req.body.libelle, 'Gestion Ouvrages', user.id)
                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //modifierla couleur d'une absence
    app.put('/api/gestion_ouvrages/modifier_ouvrage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Ouvrages', null)
                res.send(false)
            }
            else if (req.body.id === null || req.body.id === '')
                res.json(false)
            else {

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_OUVRAGES', token)) {
                    var re = "UPDATE chantiers_atelier SET ";
                    var args = [];

                    if (req.body.code_chantier !== null && req.body.code_chantier !== '') {
                        re += "code_chantier = ? ";
                        args.push(req.body.code_chantier);
                    }
                    if (req.body.duree_prevue !== null && req.body.duree_prevue !== '') {
                        if (req.body.code_chantier !== null && req.body.code_chantier !== '')
                            re += ','
                        re += "duree_prevue = ? ";

                        var duree = req.body.duree_prevue.split(':');
                        var d = duree[0] * 3600 + duree[1] * 60;

                        args.push(d);
                    }
                    if (req.body.nom_ouvrage !== null && req.body.nom_ouvrage !== '') {
                        if (req.body.code_chantier !== null && req.body.code_chantier !== '' && req.body.duree_prevue !== null && req.body.duree_prevue !== '')
                            re += ','

                        re += "nom = ? ";
                        args.push(req.body.nom_ouvrage);
                    }
                    if (req.body.commentaire !== null && req.body.commentaire !== '') {
                        if (req.body.code_chantier !== null && req.body.code_chantier !== '' && req.body.duree_prevue !== null && req.body.duree_prevue !== '' && req.body.nom_ouvrage !== null && req.body.nom_ouvrage !== '')
                            re += ','

                        re += "commentaire = ? ";
                        args.push(req.body.commentaire);
                    }
                    if ((req.body.code_chantier === null || req.body.code_chantier === '') && (req.body.nom_ouvrage === null || req.body.nom_ouvrage === ''))
                        re += "nom=nom"

                    re += " WHERE id = ? ";
                    args.push(req.body.id);

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Ouvrages', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification de l'ouvrage : " + req.body.nom_ouvrage, 'Gestion Ouvrages', user.id)
                            res.json(results);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //supprimer une absence
    app.delete('/api/gestion_ouvrages/supression/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Atelier', null)
                res.send(false)
            }

            const token = req.headers.authorization.split(' ')[1];
            const user = jsonWebToken.decode(token);

            if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_OUVRAGES', token)) {
                bdd.query('DELETE FROM chantiers_atelier WHERE id=?',
                    [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Ouvrages', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Suppression d'un ouvrage : " + req.params.id, 'Gestion Ouvrages', user.id)

                            res.json(results);
                        }
                    });
            }
            else
                res.json('SECURITY_ERROR');


        })
    })

    app.put('/api/gestion_ouvrages/actif', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
            if (err) {
                log("Erreur : " + err, 'Gestion Ouvrages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_GESTION_OUVRAGES', token)) {
                    var re = "UPDATE chantiers_atelier SET ";
                    var args = [];

                    re += "Actif = ? ";
                    args.push(req.body.Actif);
                    re += "WHERE id = ? ";
                    args.push(req.body.id);

                    var actif = (req.body.Actif === 1 ? "Actif" : "Sorti")

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Ouvrages', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification du statut de l'ouvrage " + req.body.id + ' en ' + actif, 'Gestion Ouvrages', user.id)
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
