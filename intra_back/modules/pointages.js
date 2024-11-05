module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,semaine, querystring, MYTIME_LOGS, formData) {
    const loglevel = printLogLevel()

    app.get('/api/pointages', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SAISIE', token)) {
                    bdd.query('SELECT DISTINCT S.* FROM semaines S, (SELECT P.date FROM pointages P WHERE P.etat = \'NIVEAU1\' GROUP BY date) as myPointages WHERE myPointages.date BETWEEN S.date_start AND S.date_end ',
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

    app.get('/api/pointages/sync_queue', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {

            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SYNC_QUEUE', token)) {
                    bdd.query('SELECT DISTINCT S.* FROM semaines S, pointages P WHERE P.date BETWEEN S.date_start AND S.date_end AND P.etat = "VALIDE" ',
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

    app.get('/api/pointages/validation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SAISIE', token)) {
                    bdd.query('SELECT DISTINCT S.* FROM semaines S, (SELECT P.date FROM pointages P WHERE P.etat = \'NIVEAU2\' GROUP BY date) as myPointages WHERE myPointages.date BETWEEN S.date_start AND S.date_end ',
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

    //liste des noms de chantier
    app.get('/api/pointages/noms_chantiers', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SAISIE', token)) {
                    bdd.query('SELECT code_chantier, nom_chantier FROM chantiers ' +
                        'WHERE Actif=1 AND id_mytime IS NOT NULL ' +
                        'ORDER BY nom_chantier ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    app.get('/api/pointages/resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Chantiers', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SAISIE', token)) {
                    bdd.query('SELECT matricule_resource, Nom FROM resources ' +
                        'WHERE Actif=1 AND id_mytime IS NOT NULL ' +
                        'ORDER BY nom ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    //obtenir les pointages non validés niveau 1
    app.get('/api/pointages/:idSemaine/:etat', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_CTRL', token)) {
                    var date = req.params.date;

                    bdd.query('SELECT P.*, P.original, R.matricule_resource, R.Nom, PO.date as Origine_date, PO.heure as Origine_heure, ' +
                        'PO.duree as Origine_duree, PO.id_mytime_chantier as Origine_Chantier ' +
                        'FROM pointages P ' +
                        'INNER JOIN resources R ON P.id_mytime_resource = R.id_mytime ' +
                        'INNER JOIN semaines S ON P.date BETWEEN S.date_start AND S.date_end ' +
                        'LEFT JOIN pointages_origine PO ON P.original = PO.id ' +
                        'WHERE P.etat = ? AND S.id = ? ' +
                        'ORDER BY R.Nom, id_mytime_chantier, P.date_time, action', [req.params.etat, req.params.idSemaine],
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
                                            bdd.query('SELECT nav_id, redirection_nav_id FROM utilisateurs WHERE nav_id IS NOT NULL',
                                                function (error, conducteurs, fields) {
                                                    if (error) {
                                                        log("Erreur : " + error, 'Pointages', user.id)
                                                        res.json(false)
                                                    } else {

                                                        var answer = [];

                                                        results.forEach((el) => {
                                                            if (el.id_mytime_chantier != null) {
                                                                for (let chantier of chantiers) {
                                                                    if (chantier.id_mytime == el.id_mytime_chantier) {
                                                                        el.code_chantier = chantier.code_chantier;
                                                                        el.nom_chantier = chantier.nom_chantier;
                                                                        el.code_classification = chantier.code_classification;
                                                                        el.conducteur = chantier.Conducteur;
                                                                        el.code_chantier_origine = null;
                                                                        el.nom_chantier_origine = null;

                                                                        const p = (e) => e.nav_id == el.conducteur;
                                                                        var idx = conducteurs.findIndex(p);

                                                                        if (idx != -1 && conducteurs[idx].redirection_nav_id != null)
                                                                            el.conducteur = conducteurs[idx].redirection_nav_id;

                                                                        break;
                                                                    }
                                                                }

                                                                if (el.Origine_Chantier != null) {
                                                                    for (let chantier of chantiers) {
                                                                        if (chantier.id_mytime == el.Origine_Chantier) {
                                                                            el.code_chantier_origine = chantier.code_chantier;
                                                                            el.nom_chantier_origine = chantier.nom_chantier;
                                                                            break;
                                                                        }
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
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //modifier etat
    app.put('/api/pointages/refuserPointages', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            }
            else if(req.body.etat=== null)
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                console.log(req.body)

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {
                    if(req.body.ctx != null && req.body.ctx != '' && req.body.id.length > 0){


                        bdd.query("SELECT R.Nom FROM resources R, pointages P WHERE R.id_mytime = P.id_mytime_resource AND P.id = ?", [req.body.id[0]], function (error, ressource, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                            } else if(ressource.length > 0) {
                                bdd.query("SELECT email, id FROM utilisateurs WHERE nav_id = ?", [req.body.ctx], function (error, ctx_sql, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Pointages', user.id)
                                    } else if(ctx_sql.length > 0) {
                                        notify('Pointages refusés', "Des pointages de " +ressource[0].Nom+ " ont été refusés.", ctx_sql[0].id, ctx_sql[0].email, 'warning', 'M_POINTAGES_SAISIE', 'fa-user-clock');
                                    }
                                });
                            }
                        });
                    }

                    var re = "UPDATE pointages SET ";
                    var args = [];
                    re += "etat = ? ";
                    args.push(req.body.etat);
                    if (req.body.commentaires !== null) {
                        re += ", raisons_refus = ? ";
                        args.push(req.body.commentaires);
                    }
                    if (req.body.id.length === 0)
                        res.json(false);
                    else {
                        re += "WHERE id = ? ";
                        args.push(req.body.id[0]);
                        for (let id of req.body.id) {
                            if (req.body.id[0] !== id) {
                                re += "OR id = ? ";
                                args.push(id);
                            }
                        }
                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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

    app.put('/api/pointages/allModifEtat', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            }
            else if(req.body.etat=== null)
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {
                    var re = "UPDATE pointages SET ";
                    var args = [];
                    re += "etat = ?, observations = ? ";
                    args.push(req.body.etat);
                    if (req.body.msg != null)
                        args.push(req.body.msg);
                    else
                        args.push(null);

                    if (req.body.id.length === 0)
                        res.json(false)
                    else {
                        re += "WHERE id = ? ";
                        args.push(req.body.id[0]);
                        for (let id of req.body.id) {
                            if (req.body.id[0] !== id) {
                                re += "OR id = ? ";
                                args.push(id);
                            }
                        }

                        bdd.query("SELECT R.Nom FROM resources R, pointages P WHERE R.id_mytime = P.id_mytime_resource AND P.id = ?", [req.body.id[0]], function (error, resources, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                            }
                            else{
                                if(req.body.etat == 'NIVEAU2' && resources.length > 0)
                                    log("A validé les pointages de " + resources[0].Nom, 'Pointages', user.id);
                            }
                        });

                        bdd.query(re, args, function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
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
    app.post('/api/pointages/creerPointage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {

                    bdd.query("select * from chantiers where code_chantier = ?", [req.body.chantier],
                        function(error, chantiers, fields){
                            if(error){
                                log("Error : SQL " + error, user.id);
                            }
                            else {
                                console.log(chantiers);

                                if(chantiers.length > 0 && chantiers[0].id_mytime != null)
                                {
                                    bdd.query("select * from resources where matricule_resource = ?", [req.body.id],
                                        function (error, resources, fields) {
                                            if (error) {
                                                log("Error : SQL " + error, user.id);
                                            } else {

                                                var body = JSON.stringify(MYTIME_LOGS);

                                                var options = {
                                                    url: 'https://api.mytime.fr/login',
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: body,
                                                }

                                                //Récupération du token
                                                request.post(options,
                                                    function (error, response, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                                                        } else {

                                                            tokenData = JSON.parse(response.body);
                                                            TOKEN_TYPE = "Bearer";
                                                            TOKEN = tokenData.token;

                                                            console.log("TOKEN RETRIEVED : " + TOKEN);

                                                            var body_insert = {
                                                                action: req.body.type,
                                                                company_id: chantiers[0].id_mytime,
                                                                employee_id: resources[0].id_mytime,
                                                                date_start: req.body.jour,
                                                                time: req.body.heure,
                                                                etat: req.body.etat
                                                            }

                                                            var bi = {
                                                            }

                                                            console.log(body);

                                                            const formData = {
                                                                action: req.body.type,
                                                                company_id: chantiers[0].id_mytime,
                                                                employee_id: resources[0].id_mytime,
                                                                start_date: req.body.jour,
                                                                end_date: req.body.jour,
                                                                time: req.body.heure,
                                                            }

                                                            var body = JSON.stringify(body_insert);

                                                            var options = {
                                                                url: 'https://api.mytime.fr/clock-event/add-multi',
                                                                headers: {
                                                                    'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                                },
                                                                formData: formData,
                                                            }

                                                            console.log(options)

                                                            request.post(options, function (error, resultPost, body_r) {
                                                                if (error) {
                                                                    log("Erreur : " + error, 'Pointages', user.id)
                                                                    res.json(false)
                                                                } else {
                                                                    console.log(resultPost.body)

                                                                    var insertData = JSON.parse(resultPost.body);

                                                                    if(insertData.id != null){
                                                                        var timestamp = (new Date(body_insert.date_start + ' ' + body_insert.time).getTime())/1000

                                                                        bdd.query("INSERT INTO pointages (date, heure, action, id_mytime, id_mytime_resource, id_mytime_chantier, date_time,etat)" +
                                                                            " VALUES (?, ?, ?, ?, ?, ?, ?, ?) ; INSERT INTO mytime_pointages (id_mytime) VALUES (?)",
                                                                            [body_insert.date_start, body_insert.time, body_insert.action, insertData.id,body_insert.employee_id, body_insert.company_id, timestamp, body_insert.etat, insertData.id],
                                                                            function(error, retour, fields){
                                                                                console.log("done");
                                                                                if (error) {
                                                                                    log("Erreur : " + error, 'Pointages', user.id)
                                                                                    res.json(false)
                                                                                }
                                                                                else{
                                                                                    log("Création d'un pointage : " + JSON.stringify(body_insert), 'Pointages', user.id)
                                                                                    res.json(true);
                                                                                }
                                                                            });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                            }
                                        });
                                }
                                else{
                                    console.log("Sending exception !");
                                    res.json(false);
                                }
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');

            }
        })
    })

    app.post('/api/pointages/creerTrajet', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {

                    bdd.query("select * from resources where matricule_resource = ?", [req.body.id],
                        function (error, resources, fields) {
                            if (error) {
                                log("Error : SQL " + error, user.id);
                            } else {
                                var body_insert = {
                                    action: req.body.type,
                                    employee_id: resources[0].id_mytime,
                                    date_start: req.body.jour,
                                    time: req.body.heure,
                                    etat: 'NIVEAU1'
                                }

                                if(req.body.level == 2)
                                    body_insert.etat = 'NIVEAU2';

                                var hms = req.body.heure;   // your input string
                                var a = hms.split(':'); // split it at the colons
                                if(a.length < 3)
                                    a.push('00');

                                var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

                                var timestamp = (new Date(body_insert.date_start + ' ' + body_insert.time).getTime())/1000

                                bdd.query("INSERT INTO pointages (date, heure, action, id_mytime, id_mytime_resource, id_mytime_chantier, date_time, duree, etat)" +
                                    " VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?)",
                                    [body_insert.date_start, body_insert.time, body_insert.action,body_insert.employee_id, timestamp, seconds, body_insert.etat],
                                    function(error, retour, fields){
                                        console.log("done");
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages', user.id)
                                            res.json(false)
                                        }
                                        else{
                                            log("Création d'un trajet : " + JSON.stringify(body_insert), 'Pointages', user.id)
                                            res.json(true);
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

    app.post('/api/pointages/creerPause', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {

                    bdd.query("select * from resources where matricule_resource = ?", [req.body.id],
                        function (error, resources, fields) {
                            if (error) {
                                log("Error : SQL " + error, user.id);
                            } else {
                                var level = req.body.level == 2 ? 'NIVEAU2':'NIVEAU1';

                                var body_insert = {
                                    action: 'BREAK',
                                    employee_id: resources[0].id_mytime,
                                    date_start: req.body.jour,
                                    time: req.body.heure
                                }

                                var hms = req.body.heure;   // your input string
                                var a = hms.split(':'); // split it at the colons
                                if(a.length < 3)
                                    a.push('00');

                                body_insert.time = '';
                                for(var i = 0; i < 3; i++)
                                    body_insert.time += a[i] + (i == 2 ? '':':');

                                var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

                                var timestamp = (new Date(body_insert.date_start + ' ' + body_insert.time).getTime())/1000

                                bdd.query("INSERT INTO pointages (date, heure, action, id_mytime, id_mytime_resource, id_mytime_chantier, date_time, duree, etat)" +
                                    " VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?)",
                                    [body_insert.date_start, body_insert.time, body_insert.action,body_insert.employee_id, timestamp, seconds, level],
                                    function(error, retour, fields){
                                        console.log("done");
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages', user.id)
                                            res.json(false)
                                        }
                                        else{
                                            log("Création d'une pause : " + JSON.stringify(body_insert), 'Pointages', user.id)
                                            res.json(true);
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
    //creation d'absence associée à une absence navibat
    app.post('/api/pointages/modification_pointage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {
                    bdd.query('SELECT * FROM pointages WHERE id = ? ',
                        [req.body.id], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                                res.json(false)
                            } else {
                                console.log("Length : " + results.length);

                                if (results.length >= 1) {
                                    var result = results[0];
                                    if (result.original == null) {
                                        bdd.query('INSERT INTO pointages_origine (date, heure, id_mytime_chantier, anomalie, action, date_time, duree, msg, commentaire) ' +
                                            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                            [result.date, result.heure, result.id_mytime_chantier, result.anomalie, result.action, result.date_time, result.duree, result.msg, result.commentaire],
                                            function (error, r, fields) {
                                                if (error) throw error;
                                                bdd.query('UPDATE pointages SET original = ? WHERE id = ?',
                                                    [r.insertId, req.body.id],
                                                    function (error, r, fields) {
                                                        if (error) throw error;
                                                    });
                                            });
                                    }

                                    bdd.query('SELECT * FROM chantiers WHERE code_chantier = ?',
                                        req.body.code_chantier_modifie, function (error, chantiers, fields) {
                                            if (error) {
                                                log("Erreur : " + error, 'Pointages', user.id)
                                                res.json(false)
                                            } else {
                                                if (chantiers.length >= 1) {
                                                    var date_time = "LOL";

                                                    var date = result.date;

                                                    var hms = req.body.heure_modifie;   // your input string
                                                    var a = hms.split(':'); // split it at the colons
                                                    if (a.length < 3)
                                                        a.push('00');

                                                    console.log(a)
                                                    date.setHours(a[0]);
                                                    date.setMinutes(a[1]);
                                                    date.setSeconds(a[2]);
                                                    date_time = Date.parse(date) / 1000;

                                                    var req_update = 'UPDATE pointages SET heure = ?, action = ?, commentaire = ?, id_mytime_chantier = ?, date_time = ? WHERE id = ?';
                                                    var args = [];
                                                    if(req.body.type_modifie == null || typeof req.body.type_modifie =='undefined'){
                                                        req_update = 'UPDATE pointages SET heure = ?, commentaire = ?, id_mytime_chantier = ?, date_time = ? WHERE id = ?';
                                                        args = [req.body.heure_modifie, req.body.commentaires, chantiers[0].id_mytime, date_time, req.body.id]
                                                    }else {
                                                        args = [req.body.heure_modifie, req.body.type_modifie, req.body.commentaires, chantiers[0].id_mytime, date_time, req.body.id]
                                                    }

                                                    bdd.query(req_update,
                                                        args,
                                                        function (error, r, fields) {
                                                            if (error) {
                                                                log("Erreur : " + error, 'Pointages', user.id)
                                                                res.json(false)
                                                            }

                                                            var body_login = JSON.stringify(MYTIME_LOGS);

                                                            var options_login = {
                                                                url: 'https://api.mytime.fr/login',
                                                                headers: {
                                                                    'Content-Type': 'application/json'
                                                                },
                                                                body: body_login,
                                                            }


                                                            request.post(options_login,
                                                                function (error, response, body) {
                                                                    if (error) {
                                                                        log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                                                                    } else {

                                                                        console.log(response.body)

                                                                        var tokenData = JSON.parse(response.body);
                                                                        let TOKEN_TYPE = "Bearer";
                                                                        let TOKEN = tokenData.token;

                                                                        console.log("TOKEN RETRIEVED : " + TOKEN);

                                                                        //console.log(chantiers[0])
                                                                        console.log(result);

                                                                        var d_t = new Date(result.date);
                                                                        var date_pointage = d_t.getFullYear() + '-' +
                                                                            ("0" + (d_t.getMonth() + 1)).slice(-2) + '-' +
                                                                            ("0" + d_t.getDate()).slice(-2);

                                                                        var body = {
                                                                            employee_id: result.id_mytime_resource,
                                                                            date: date_pointage,
                                                                            time: a.join(':'),
                                                                            company_id: chantiers[0].id_mytime,
                                                                            action: result.action,
                                                                        }

                                                                        if(req.body.type_modifie !== null && typeof req.body.type_modifie !=='undefined'){
                                                                            body.action = req.body.type_modifie
                                                                        }

                                                                        console.log(body);

                                                                        body = querystring.stringify(body);

                                                                        var options = {
                                                                            url: 'https://api.mytime.fr/clock-event/' + result.id_mytime,
                                                                            headers: {
                                                                                'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                                                'Content-Type': 'application/x-www-form-urlencoded'
                                                                            },
                                                                            body: body,
                                                                        }

                                                                        console.log(options);

                                                                        request.patch(options, function (error, resultPost, body) {
                                                                            if (error) {
                                                                                log("Erreur : " + error, 'Pointages', user.id)
                                                                                res.json(false)
                                                                            } else {
                                                                                console.log("Done");
                                                                                //console.log(error);
                                                                                //console.log(resultPost);

                                                                                res.json(results);
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                        });

                                                } else
                                                    res.json(false);
                                            }
                                        });
                                }
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');

            }
        })
    })

    app.post('/api/pointages/modification_trajet', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {

                    bdd.query('SELECT * FROM pointages WHERE id = ? ',
                        [req.body.id], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                                res.json(false)
                            }

                            var result = results[0];
                            if (result.original == null) {
                                bdd.query('INSERT INTO pointages_origine (date, heure, id_mytime_chantier, anomalie, action, date_time, duree, msg, commentaire) ' +
                                    'VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)',
                                    [result.date, result.heure, result.anomalie, result.action, result.date_time, result.duree, result.msg, result.commentaire],
                                    function (error, r, fields) {
                                        if (error) throw error;
                                        bdd.query('UPDATE pointages SET original = ? WHERE id = ?',
                                            [r.insertId, req.body.id],
                                            function (error, r, fields) {
                                                if (error) throw error;
                                            });
                                    });
                            }
                            var hms = req.body.duree_trajet;   // your input string
                            var a = hms.split(':'); // split it at the colons
                            if (a.length < 3)
                                a.push('00');

                            var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

                            //console.log(seconds);

                            bdd.query('UPDATE pointages SET duree = ?, commentaire = ? WHERE id = ?',
                                [seconds, req.body.commentaire, req.body.id],
                                function (error, r, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Pointages', user.id)
                                        res.json(false)
                                    }

                                    res.json(true);

                                });

                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    app.post('/api/pointages/modification_pause', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_CTRL', token)) {

                    bdd.query('SELECT * FROM pointages WHERE id = ? ',
                        [req.body.id], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                                res.json(false)
                            }

                            var result = results[0];
                            if (result.original == null) {
                                bdd.query('INSERT INTO pointages_origine (date, heure, id_mytime_chantier, anomalie, action, date_time, duree, msg, commentaire) ' +
                                    'VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)',
                                    [result.date, result.heure, result.anomalie, result.action, result.date_time, result.duree, result.msg, result.commentaire],
                                    function (error, r, fields) {
                                        if (error) throw error;
                                        bdd.query('UPDATE pointages SET original = ? WHERE id = ?',
                                            [r.insertId, req.body.id],
                                            function (error, r, fields) {
                                                if (error) throw error;
                                            });
                                    });
                            }
                            var hms = req.body.duree_pause;   // your input string
                            var a = hms.split(':'); // split it at the colons
                            if (a.length < 3)
                                a.push('00');

                            var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

                            //console.log(seconds);

                            bdd.query('UPDATE pointages SET duree = ?, commentaire = ? WHERE id = ?',
                                [seconds, req.body.commentaire, req.body.id],
                                function (error, r, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Pointages', user.id)
                                        res.json(false)
                                    }

                                    res.json(true);

                                });

                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    app.delete('/api/pointages/supprimerPointage/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'special', 'M_POINTAGES_SAISIE', token) || SECURITY.canAccessRessource(user, 'special', 'M_POINTAGES_CTRL', token)) {

                    bdd.query('SELECT * FROM pointages WHERE id = ?',
                        [req.params.id],
                        function (error, r, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages', user.id)
                                res.json(false)
                            } else {
                                log("SUPPRESSION DE POINTAGE : " + JSON.stringify(r), 'Pointages', user.id);

                                bdd.query("DELETE FROM pointages WHERE id = ?", [req.params.id], function (error, result, fileds) {
                                    if (error) {
                                        log("Erreur : " + error, 'Pointages', user.id)
                                        res.json(false)
                                    } else {

                                        var body_login = JSON.stringify(MYTIME_LOGS);

                                        var options_login = {
                                            url: 'https://api.mytime.fr/login',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: body_login,
                                        }


                                        request.post(options_login,
                                            function (error, response, body) {
                                                if (error) {
                                                    log("Erreur synchronisation MyTime : " + error, 'Chantiers', null);
                                                } else {

                                                    console.log(response.body)

                                                    var tokenData = JSON.parse(response.body);
                                                    let TOKEN_TYPE = "Bearer";
                                                    let TOKEN = tokenData.token;

                                                    console.log("TOKEN RETRIEVED : " + TOKEN);

                                                    var options = {
                                                        url: 'https://api.mytime.fr/clock-event/' + r.id_mytime,
                                                        headers: {
                                                            'Authorization': TOKEN_TYPE + ' ' + TOKEN,
                                                            'Content-Type': 'application/x-www-form-urlencoded'
                                                        },
                                                    }
                                                    request.delete(options, function (error, absDelete, body) {
                                                        if (error) {
                                                            log("Erreur synchronisation MyTime : " + error, 'Sync Pointages', null);
                                                            res.json(false);
                                                        } else {
                                                            console.log("Requête de suppression envoyée");

                                                            res.json(true);
                                                        }
                                                    });

                                                }
                                            });
                                    }
                                });

                                if (r.length > 0 && r[0].original != null) {
                                    bdd.query("DELETE FROM pointages_origine WHERE id = ?", [req.params.id], function (error, result, fileds) {
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages', user.id)
                                            res.json(false)
                                        }
                                    });
                                }
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })


    //obtenir les pointages non validés niveau 1
    app.get('/api/pointages/copy/:idSemaine/:matricule/:date', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                var date = req.params.date;

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SAISIE', token)) {
                    bdd.query('SELECT P.*, P.original, R.matricule_resource, R.Nom, PO.date as Origine_date, PO.heure as Origine_heure, ' +
                        'PO.duree as Origine_duree, PO.id_mytime_chantier as Origine_Chantier ' +
                        'FROM pointages P ' +
                        'INNER JOIN resources R ON P.id_mytime_resource = R.id_mytime ' +
                        'INNER JOIN semaines S ON P.date BETWEEN S.date_start AND S.date_end ' +
                        'LEFT JOIN pointages_origine PO ON P.original = PO.id ' +
                        'WHERE R.matricule_resource = ? AND P.date = ?' +
                        'ORDER BY R.Nom, id_mytime_chantier, P.date_time, action', [req.params.matricule, req.params.date],
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
                                            bdd.query('SELECT nav_id, redirection_nav_id FROM utilisateurs WHERE nav_id IS NOT NULL',
                                                function (error, conducteurs, fields) {
                                                    if (error) {
                                                        log("Erreur : " + error, 'Pointages', user.id)
                                                        res.json(false)
                                                    } else {

                                                        var answer = [];

                                                        results.forEach((el) => {
                                                            if (el.id_mytime_chantier != null) {
                                                                for (let chantier of chantiers) {
                                                                    if (chantier.id_mytime == el.id_mytime_chantier) {
                                                                        el.code_chantier = chantier.code_chantier;
                                                                        el.nom_chantier = chantier.nom_chantier;
                                                                        el.code_classification = chantier.code_classification;
                                                                        el.conducteur = chantier.Conducteur;
                                                                        el.code_chantier_origine = null;
                                                                        el.nom_chantier_origine = null;

                                                                        const p = (e) => e.nav_id == el.conducteur;
                                                                        var idx = conducteurs.findIndex(p);

                                                                        if (idx != -1 && conducteurs[idx].redirection_nav_id != null)
                                                                            el.conducteur = conducteurs[idx].redirection_nav_id;

                                                                        break;
                                                                    }
                                                                }

                                                                if (el.Origine_Chantier != null) {
                                                                    for (let chantier of chantiers) {
                                                                        if (chantier.id_mytime == el.Origine_Chantier) {
                                                                            el.code_chantier_origine = chantier.code_chantier;
                                                                            el.nom_chantier_origine = chantier.nom_chantier;
                                                                            break;
                                                                        }
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
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });
}