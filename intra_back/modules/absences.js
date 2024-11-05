module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

//semaine actuelle id et numéro
    app.get('/api/absences/temps/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_ABSENCE', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT nb_semaine, id, date_start, date_end FROM semaines " +
                        "WHERE date_start LIKE '" + date + "%' OR DATE_SUB(date_end, INTERVAL 2 DAY) LIKE '" + date + "%' ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                if (results.length > 1) {
                                    bdd.query("SELECT * FROM absences ",
                                        function (error, results1, fields) {
                                            if (error) {
                                                log("Erreur : " + error, 'Planning Absences', user.id)
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
                                                        absences: results1
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

    app.get('/api/absences_viewer/temps/:date_start/:date_end', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_ABSENCE', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT nb_semaine, id, date_start, date_end FROM semaines " +
                        "WHERE id BETWEEN ? and ? ", [req.params.date_start, req.params.date_end],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                if (results.length > 1) {
                                    bdd.query("SELECT * FROM absences ",
                                        function (error, results1, fields) {
                                            if (error) {
                                                log("Erreur : " + error, 'Planning Absences', user.id)
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
                                                        absences: results1
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

    //obtenir les absences
    app.get('/api/gestion_absences', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_ABSENCE', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT * FROM absences ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
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

    //obtenir les absences
    app.get('/api/absences_viewer', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_ABSENCE_VIEWER', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT DISTINCT S.* FROM semaines S, assignations_absence ASS WHERE S.id = ASS.id_semaine ORDER BY S.id DESC ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            }
                            else {
                                bdd.query("SELECT * FROM absences ",
                                    function (error, results1, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Absences', user.id)
                                            res.json(false)
                                        } else {
                                            var callback = {
                                                listSemaines: results,
                                                listAbsences: results1
                                            }

                                            res.json(JSON.stringify(callback));
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

//liste assignaitons absences et resources
    app.post('/api/absences/assignations', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_ABSENCE', token)) {


                    const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    try {
                        var jData = JSON.parse(req.body.listMonth);
                        var obj = JSON.parse(req.body.results);
                        var absences = JSON.parse(req.body.absences);
                    } catch (e) {
                        console.log("Invalid data received : " + req.body.listMonth);
                        console.log("Invalid data received : " + req.body.results);
                        console.log("Invalid data received : " + req.body.absences);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var sql_req = '(SELECT absences.Nom,absences.jour, absences.journee , absences.id ,' +
                        'absences.matricule_resource , absences.code_absence FROM (SELECT semaines.id, ' +
                        'resources.matricule_resource, resources.Nom, assignations_absence.code_absence,' +
                        'assignations_absence.jour,assignations_absence.journee FROM assignations_absence ' +
                        'INNER JOIN semaines ON semaines.id= assignations_absence.id_semaine ' +
                        'INNER JOIN resources ON resources.matricule_resource=assignations_absence.matricule_resource ' +
                        'WHERE (resources.Type="SALARIE" OR resources.Type="ADMINISTRATIF")  AND ( ' //
                    var args = []

                    var i = 0
                    jData.forEach((el) => {
                        i++
                        sql_req += 'semaines.id =? ' + (i < jData.length ? "OR " : "")
                        args.push(el)
                    })
                    sql_req += ')) AS absences ' +
                        'ORDER BY absences.Nom ASC) ' +
                        'UNION ' + //
                        '(SELECT resources.Nom, null as jour, null as journee , null as id ,resources.matricule_resource , null as code_absence FROM resources where Actif = 1 AND (resources.Type="SALARIE" OR resources.Type="ADMINISTRATIF"))  ' +
                        'order by Nom ASC'
                    //console.log(request)
                    bdd.query(sql_req, args,
                        (error, results, fields) => {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                var assignations_absences = [];
                                for (let el of results) {
                                    if (el.code_absence !== null) {
                                        var week = el.id - obj[0].id;
                                        var pos = absences.findIndex(i => i.code_absence === el.code_absence);

                                        var body = {
                                            code_absence: el.code_absence,
                                            description: absences[pos].description,
                                            couleur: absences[pos].couleur,
                                            type: absences[pos].type
                                        }
                                        if (assignations_absences.findIndex(i => i.matricule_resource === el.matricule_resource) !== -1) {
                                            var index = assignations_absences.findIndex(i => i.matricule_resource === el.matricule_resource);
                                            if (el.journee !== 0)
                                                assignations_absences[index].mois[week][el.jour][el.journee - 1] = body;
                                            else {
                                                assignations_absences[assignations_absences.length - 1].mois[week][el.jour][0] = body;
                                                assignations_absences[assignations_absences.length - 1].mois[week][el.jour][1] = body;
                                            }
                                        } else {
                                            var t_obj = {
                                                matricule_resource: el.matricule_resource,
                                                Nom_matricule: el.Nom,
                                                mois: []
                                            }

                                            for(var i = 0; i < jData.length; i++)
                                                t_obj.mois.push([[{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}]]);

                                            assignations_absences.push(t_obj);

                                            if (el.code_absence !== null) {
                                                if (el.journee !== 0)
                                                    assignations_absences[assignations_absences.length - 1].mois[week][el.jour][el.journee - 1] = body;
                                                else {
                                                    assignations_absences[assignations_absences.length - 1].mois[week][el.jour][0] = body;
                                                    assignations_absences[assignations_absences.length - 1].mois[week][el.jour][1] = body;
                                                }
                                            }
                                        }
                                    } else {
                                        if (assignations_absences.findIndex(i => i.matricule_resource === el.matricule_resource) === -1) {
                                            var t_obj = {
                                                matricule_resource: el.matricule_resource,
                                                Nom_matricule: el.Nom,
                                                mois: []
                                            }

                                            for(var i = 0; i < jData.length; i++)
                                                t_obj.mois.push([[{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}]]);

                                            assignations_absences.push(t_obj);
                                        }
                                    }
                                }

                                //console.log(JSON.stringify(assignations_absences))
                                res.json(JSON.stringify(assignations_absences));
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
    app.post('/api/absences/attribution_absence', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_ABSENCE', token)) {
                    try {
                        var jData = JSON.parse(req.body.listAttributions);
                    } catch (e) {
                        console.log("Invalid data received : " + req.body.listAttributions);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var req_del = "DELETE FROM assignations WHERE ";
                    var req_insert = "INSERT INTO assignations_absence (matricule_resource, code_absence, jour, id_semaine,journee) VALUES ";

                    var where = "1=0 ";
                    var args_del = [];
                    var args_insert = [];


                    var i = 0;
                    jData.forEach((el) => {
                        i++;
                        var isOk = true;

                        if (typeof el.matricule === 'undefined' || el.matricule === '' || el.matricule === null) {
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
                        if (typeof el.code_absence === 'undefined' || el.code_absence === '' || el.code_absence === null) {
                            console.log("Code absence invalide");
                            isOk = false;
                        }
                        if (typeof el.journee === 'undefined' || el.journee === '' || el.journee === null) {
                            console.log("Journee invalide");
                            isOk = false;
                        }

                        if (!isOk) {
                            console.log("Invalid data received : " + req.body.listAttributions);
                            res.json("INVALID_DATA");
                            return;
                        }
                        if(el.journee != 0){
                            where += "OR (matricule_resource = ? AND id_semaine = ? AND jour = ? AND journee = ?) ";
                            args_del.push(el.matricule);
                            args_del.push(el.semaine);
                            args_del.push(el.jour);
                            args_del.push(el.journee);
                        }
                        else {
                            where += "OR (matricule_resource = ? AND id_semaine = ? AND jour = ? ) ";
                            args_del.push(el.matricule);
                            args_del.push(el.semaine);
                            args_del.push(el.jour);
                        }

                        req_insert += "(?, ?, ?, ?,?)" + (i < jData.length ? ", " : "");
                        args_insert.push(el.matricule);
                        args_insert.push(el.code_absence);
                        args_insert.push(el.jour);
                        args_insert.push(el.semaine);
                        args_insert.push(el.journee);

                    });

                    req_del = req_del + where + " ; DELETE FROM assignations_absence WHERE " + where;
                    var req_args_del = args_del.concat(args_del);


                    bdd.query(req_del, req_args_del, (error, results, files) => {
                        if (error) {
                            log("Erreur : " + error, 'Planning Absences', user.id)
                            res.json(false)
                        } else {
                            bdd.query(req_insert, args_insert, (error, results, files) => {
                                if (error) {
                                    log("Erreur : " + error, 'Planning Absences', user.id)
                                    res.json(false)
                                } else {
                                    if (printLogLevel() >= 1) {
                                        jData.forEach((el) => {
                                            var date = getDate(printSemaines(), el.semaine, el.jour)
                                            if (el.journee == 0)
                                                log("Ajout absence " + el.code_absence + ' à ' + el.matricule + ' le ' +
                                                    date, 'Planning Absences', user.id)
                                            else if (el.journee == 1)
                                                log("Ajout absence " + el.code_absence + ' à ' + el.matricule + ' le ' +
                                                    date + " matin ", 'Planning Absences', user.id)
                                            else if (el.journee == 2)
                                                log("Ajout absence " + el.code_absence + ' à ' + el.matricule + ' le ' +
                                                    date + " après-midi ", 'Planning Absences', user.id)
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

    //modifier
    app.put('/api/absences/modif_assignation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else if(req.body.matricule=== null || req.body.matricule=== '')
                res.json(false)
            else if(req.body.jour=== null || req.body.jour=== '')
                res.json(false)
            else if(req.body.semaine=== null || req.body.semaine=== '')
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_ABSENCE', token)) {
                    try {
                        var jData = JSON.parse(req.body.listUpdate);
                    } catch (e) {
                        console.log("Invalid data received : " + req.body);
                        res.send("INVALID_DATA");
                        return;
                    }
                    var re = ""
                    var args = [];
                    console.log(jData)

                    jData.forEach((el) => {
                        re += "UPDATE assignations_absence SET journee = ? ";
                        args.push(el.journee);

                        re += "WHERE matricule_resource = ? AND id_semaine = ? AND jour = ? AND journee = ? ;";
                        args.push(el.matricule);
                        args.push(el.semaine);
                        args.push(el.jour);
                        args.push(el.old_journee);

                        console.log(re)
                        console.log(args)

                    })

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Absences', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1) {
                                jData.forEach((el) => {
                                    var date = getDate(printSemaines(), el.semaine, el.jour)
                                    log("Supression de l'absence de " + el.matricule + " sur la demie-journée " +
                                        el.journee + " du " + date, 'Planning Absences', user.id)
                                })
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

    //creation d'absence associée à une absence navibat
    app.post('/api/absences/creation_absence', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ABSENCES', token)) {
                    bdd.query('INSERT INTO absences (code_absence, description, type, couleur) ' +
                        'VALUES (?, ?, ?,?)',
                        [req.body.code_absence, req.body.description, req.body.association, req.body.couleur],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Ajout d'une absence : " + req.body.description, 'Gestion Absences', user.id)
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
    app.put('/api/absences/modifColor', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else if(req.body.code_absence=== null || req.body.code_absence=== '')
                res.json(false)
            else {

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ABSENCES', token)) {
                    var re = "UPDATE absences SET ";
                    var args = [];
                    re += "couleur = ? ";
                    args.push(req.body.couleur);

                    re += "WHERE code_absence = ? ";
                    args.push(req.body.code_absence);

                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Absences', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1)
                                log("Modification du code couleur de l'absence : " + req.body.description, 'Gestion Absences', user.id)
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
    app.delete('/api/absences/supression/:code_absence/:type', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }

            console.log(req.params)

            if (req.params.type !== 'ERP') {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_ABSENCES', token)) {

                    console.log('CAN REMOVE LOL')
                    bdd.query('DELETE FROM absences WHERE code_absence=?',
                        [req.params.code_absence], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Suppression d'une absence : " + req.params.code_absence, 'Gestion Absences', user.id)

                                res.json(results);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
            else {
                res.json(false)
            }

        })
    })

    //supprimer une assignation absence
    app.post('/api/absences/supression_assignation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null)
                res.send(false)
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_ABSENCE', token)) {
                    try {
                        var jData = JSON.parse(req.body.listDelete);

                    } catch (e) {
                        console.log("Invalid data received ici : " + req.body.listAttributions);
                        res.send("INVALID_DATA");
                        return;
                    }

                    var req_del = "DELETE FROM assignations_absence WHERE ";

                    var where = "1=0 ";
                    var args_del = [];

                    var i = 0;
                    jData.forEach((el) => {
                        i++;
                        var isOk = true;

                        if (typeof el.matricule === 'undefined' || el.matricule === '' || el.matricule === null) {
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
                        if (typeof el.journee === 'undefined' || el.journee === '' || el.journee === null) {
                            console.log("Journee invalide");
                            isOk = false;
                        }

                        if (!isOk) {
                            console.log("Invalid data received : " + req.body.listAttributions);
                            res.json("INVALID_DATA");
                            return;
                        }
                        if(el.journee != 0){
                            where += "OR (matricule_resource = ? AND id_semaine = ? AND jour = ? AND journee= ? ) ";
                            args_del.push(el.matricule);
                            args_del.push(el.semaine);
                            args_del.push(el.jour);
                            args_del.push(el.journee);
                        }
                        else {
                            where += "OR (matricule_resource = ? AND id_semaine = ? AND jour = ? ) ";
                            args_del.push(el.matricule);
                            args_del.push(el.semaine);
                            args_del.push(el.jour);
                        }


                    });

                    req_del = req_del + where

                    console.log(req_del);
                    console.log(args_del);
                    bdd.query(req_del, args_del,
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                jData.forEach((el) => {
                                    if (printLogLevel() >= 1) {
                                        var date = getDate(printSemaines(), el.semaine, el.jour)
                                        if (el.journee === 0)
                                            log("Suppression absence à " + el.matricule + ' le ' + date,
                                                'Planning Absences', user.id)
                                        else if (el.journee === 1)
                                            log("Suppression absence à " + el.matricule + ' le ' + date + " matin ",
                                                'Planning Absences', user.id)
                                        else if (el.journee === 2)
                                            log("Suppression absence à " + el.matricule + ' le ' + date + " après-midi",
                                                'Planning Absences', user.id)
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

    app.get('/api/absences/export/:year', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Absences', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'special', 'M_ABSENCE', token)) {
                    var year = req.params.year;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT nb_semaine, id, date_start, date_end FROM semaines " +
                        "WHERE YEAR(date_start) = ? OR YEAR(date_end) = ? ", [year, year],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Absences', user.id)
                                res.json(false)
                            } else {
                                //console.log(results);

                                var req = '(SELECT absences.Nom, date_start, date_end, absences.jour, absences.journee , absences.id, ' +
                                    'absences.matricule_resource , absences.code_absence FROM (SELECT semaines.id, semaines.date_start, semaines.date_end, ' +
                                    'resources.matricule_resource, resources.Nom, assignations_absence.code_absence,' +
                                    'assignations_absence.jour,assignations_absence.journee FROM assignations_absence ' +
                                    'INNER JOIN semaines ON semaines.id= assignations_absence.id_semaine ' +
                                    'INNER JOIN resources ON resources.matricule_resource=assignations_absence.matricule_resource ' +
                                    'WHERE (resources.Type="SALARIE" OR resources.Type="ADMINISTRATIF")  AND ( ' //
                                var args = []

                                var i = 0
                                results.forEach((el) => {
                                    i++
                                    req += 'semaines.id =? ' + (i < results.length ? "OR " : "")
                                    args.push(el.id)
                                })
                                req += ')) AS absences ' +
                                    'ORDER BY absences.Nom ASC) '

                                bdd.query(req, args,
                                    (error, result_abs, fields) => {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Absences', user.id)
                                            res.json(false)
                                        } else {

                                            var feries = [];

                                            request.get('https://calendrier.api.gouv.fr/jours-feries/metropole/'+year+'.json', function (error, result, body) {
                                                if (error) {
                                                    log("Erreur : " + error, 'PointagesNav', user.id)
                                                } else {
                                                    var j = JSON.parse(result.body);

                                                    feries = Object.keys(j);


                                                    //console.log(result_abs)

                                                    let list_abs = [];

                                                    result_abs.forEach((el) => {
                                                        const p = (e) => e.matricule_resource == el.matricule_resource;

                                                        var day = new Date(el.date_start);
                                                        day.setDate(day.getDate() + el.jour);

                                                        var idx = list_abs.findIndex(p);

                                                        var dateString = day.getFullYear() + '-' +
                                                            ("0" + (day.getMonth() + 1)).slice(-2) + '-' +
                                                            ("0" + day.getDate()).slice(-2);

                                                        if(day.getDay() != 0 && day.getDay() != 6
                                                            && el.code_absence != 'FERIE' && !feries.includes(dateString)
                                                            && day.getFullYear() == year){

                                                            if(idx != -1)
                                                                list_abs[idx].months[day.getMonth()] += (el.journee == 0 ? 1 : 0.5);
                                                            else {
                                                                let obj = {
                                                                    matricule_resource: el.matricule_resource,
                                                                    nom: el.Nom,
                                                                    months: [0,0,0,0,0,0,0,0,0,0,0,0]
                                                                }

                                                                obj.months[day.getMonth()] += (el.journee == 0 ? 1:0.5);


                                                                list_abs.push(obj);
                                                            }
                                                        }
                                                    });

                                                    res.json(list_abs);
                                                }
                                            });

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

}
