module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,semaine, querystring, NAV_KEY) {
    const loglevel = printLogLevel();

    app.get('/api/historique-chantiers/:code_chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_HISTORIQUE', token)) {
                    bdd.query('select DISTINCT A.matricule_resource, R.Nom from assignations A, resources R where A.matricule_resource = R.matricule_resource and A.code_chantier = ?', [req.params.code_chantier],
                        function (error, resources, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Historique chantiers', user.id)
                                res.json(false)
                            } else {

                                bdd.query('SELECT R.matricule_resource, R.Nom, P.* ' +
                                    'FROM pointages P ' +
                                    'INNER JOIN resources R ON P.id_mytime_resource = R.id_mytime ' +
                                    'INNER JOIN chantiers C ON C.id_mytime = P.id_mytime_chantier ' +
                                    'WHERE C.code_chantier = ? ' +
                                    'ORDER BY R.matricule_resource, id_mytime_chantier, P.date_time, action', [req.params.code_chantier],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages', user.id)
                                            res.json(false)
                                        } else {
                                            var answer = [];

                                            resources.forEach((el) => {
                                                const p = (e) => e.matricule_resource == el.matricule_resource;
                                                var idx = answer.findIndex(p);
                                                if (idx == -1) {
                                                    var t = {};
                                                    t.matricule_resource = el.matricule_resource;
                                                    t.nom = el.Nom;
                                                    t.pointages = [];
                                                    t.duree = 0;

                                                    answer.push(t);
                                                }
                                            });

                                            results.forEach((el) => {
                                                const p = (e) => e.matricule_resource == el.matricule_resource;
                                                var idx = answer.findIndex(p);
                                                if (idx == -1) {
                                                    var t = {};
                                                    t.matricule_resource = el.matricule_resource;
                                                    t.nom = el.Nom;
                                                    t.pointages = [];
                                                    t.duree = 0;

                                                    var dates = {};
                                                    dates.date = el.date;
                                                    dates.data = [];
                                                    dates.data.push(el);

                                                    t.pointages.push(dates);

                                                    answer.push(t);
                                                } else {
                                                    var idx_date = -1;

                                                    for (var i = 0; i < answer[idx].pointages.length; i++) {
                                                        if ((new Date(answer[idx].pointages[i].date)).getDate() == (new Date(el.date)).getDate())
                                                            idx_date = i;
                                                    }

                                                    if (idx_date == -1) {
                                                        var dates = {};
                                                        dates.date = el.date;
                                                        dates.data = [];
                                                        dates.data.push(el);

                                                        answer[idx].pointages.push(dates);
                                                    } else {
                                                        answer[idx].pointages[idx_date].data.push(el);

                                                        console.log(answer[idx].pointages[idx_date])
                                                    }
                                                }
                                            });

                                            for (var idx = 0; idx < answer.length; idx++) {
                                                var tmp_duree = 0;

                                                answer[idx].pointages.forEach((days) => {
                                                    var start = [];
                                                    var end = [];

                                                    days.data.forEach((data) => {
                                                        if (data.action == 'DEBUT')
                                                            start.push(data.heure);
                                                        else
                                                            end.push(data.heure);
                                                    });

                                                    var maxIdx = start.length > end.length ? end.length : start.length;

                                                    for (var idx_tmp = 0; idx_tmp < maxIdx; idx_tmp++) {
                                                        var tmp_start = start[idx_tmp];
                                                        var tmp_end = end[idx_tmp];

                                                        var timeStart = new Date("01/01/2021 " + tmp_start).getTime();
                                                        var timeEnd = new Date("01/01/2021 " + tmp_end).getTime();

                                                        tmp_duree += (timeEnd - timeStart) / 1000;
                                                    }
                                                });

                                                answer[idx].duree = tmp_duree;
                                            }
                                            //console.log(answer);

                                            res.json(answer);
                                        }
                                    });
                            }
                        });
                }
            }
        });
    });

    app.get('/api/historique-chantiers/pointages/', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_CHANTIERS_HISTORIQUE', token)) {
                    var date = req.params.date;
                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query('SELECT P.*, P.original, R.matricule_resource, R.Nom, PO.date as Origine_date, PO.heure as Origine_heure, ' +
                        'PO.duree as Origine_duree, PO.id_mytime_chantier as Origine_Chantier ' +
                        'FROM pointages P ' +
                        'INNER JOIN resources R ON P.id_mytime_resource = R.id_mytime ' +
                        'LEFT JOIN pointages_origine PO ON P.original = PO.id ' +
                        'WHERE P.etat = ? ' +
                        'ORDER BY R.Nom, id_mytime_chantier, P.date_time, action', [req.params.etat],
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
                                                if (el.id_mytime_chantier != null) {
                                                    for (let chantier of chantiers) {
                                                        if (chantier.id_mytime == el.id_mytime_chantier) {
                                                            el.code_chantier = chantier.code_chantier;
                                                            el.nom_chantier = chantier.nom_chantier;
                                                            el.conducteur = chantier.Conducteur;
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
            }
        });
    });
}