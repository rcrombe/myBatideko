module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,
                           printSemaines,getNBsemaine,getDate) {

    app.get('/api/vehicules', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            }else {

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT immatriculation,flocage,vehicules.type,vehicules.nom,chauffeur,domicile,nb_places,' +
                        'controle_technique,kilometrage,derniere_modif_km,certificat_air,carte,gazole,commentaire,' +
                        'dispo,matricule_resource,resources.Nom AS nom_resource FROM vehicules ' +
                        'LEFT JOIN resources on resources.matricule_resource = vehicules.chauffeur ' +
                        'WHERE vehicules.vendu = 0 AND vehicules.bureaux = 0 ' +
                        'ORDER BY vehicules.type ASC ', function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Véhicules', user.id)
                            res.json(false)
                        } else {
                            res.json(results);
                        }
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //liste des personnes sans vehicules
    app.get('/api/vehicules/non_attribues/:id_semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT DISTINCT assignations.matricule_resource, jour, resources.Nom FROM assignations ' +
                        'INNER JOIN resources ON resources.matricule_resource = assignations.matricule_resource ' +
                        'WHERE NOT EXISTS (SELECT 1  FROM assignations_vehicules WHERE id_semaine = ? AND ' +
                        'assignations.matricule_resource=assignations_vehicules.matricule_resource ' +
                        'AND assignations.jour=assignations_vehicules.jour ) ' +
                        'AND id_semaine = ? AND resources.Type="SALARIE" AND assignations.code_chantier NOT LIKE "\\_%" ' +
                        'ORDER BY jour ',
                        [req.params.id_semaine, req.params.id_semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
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

    //liste des personnes dans un véhicule et leur chantier
    app.get('/api/vehicules/chantiers_mismatch/:id_semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT AV.immatriculation, AV.jour, AV.matricule_resource, A.code_chantier, R.Nom ' +
                        'FROM assignations_vehicules AV, assignations A, resources R ' +
                        'WHERE AV.id_semaine = ? AND A.id_semaine = AV.id_semaine ' +
                        'AND A.matricule_resource = AV.matricule_resource ' +
                        'AND R.matricule_resource = A.matricule_resource ' +
                        'AND AV.jour = A.jour ' +
                        'AND A.code_chantier NOT LIKE "\\_%" ' +
                        'GROUP BY AV.jour, AV.immatriculation, AV.matricule_resource, A.code_chantier, R.Nom ',
                        [req.params.id_semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
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



    app.get('/api/vehicules/assignations/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT vehicules.domicile,vehicules.dispo,vehicules.flocage,resources.Type,' +
                        'resources.Actif,semaines.id, vehicules.chauffeur AS chauffeurAttitre, ' +
                        'resources.matricule_resource, resources.Nom,vehicules.type, semaines.nb_semaine,' +
                        'semaines.date_start, semaines.date_end, vehicules.nb_places, vehicules.immatriculation,' +
                        'assignations_vehicules.jour, assignations_vehicules.chauffeur FROM assignations_vehicules ' +
                        'INNER JOIN semaines ON semaines.id= assignations_vehicules.id_semaine  AND semaines.id=?' +
                        'INNER JOIN resources ON resources.matricule_resource=assignations_vehicules.matricule_resource ' +
                        'RIGHT JOIN vehicules ON vehicules.immatriculation=assignations_vehicules.immatriculation ' +
                        'WHERE vehicules.vendu = 0 and vehicules.bureaux = 0 ' +
                        'ORDER BY vehicules.type ASC,vehicules.immatriculation ASC, assignations_vehicules.chauffeur DESC',
                        [req.params.idSemaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
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

    app.get('/api/vehicules/assignations_chantiers/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT assignations.matricule_resource FROM assignations ' +
                        'INNER JOIN resources ON assignations.matricule_resource=resources.matricule_resource ' +
                        'INNER JOIN semaines ON semaines.id = assignations.id_semaine ' +
                        'WHERE assignations.id_semaine = ? AND resources.type="SALARIE" ' +
                        'GROUP BY assignations.matricule_resource', [req.params.idSemaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    app.get('/api/vehicules/assignations_vehicules/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT assignations_vehicules.matricule_resource FROM assignations_vehicules ' +
                        'INNER JOIN resources ON assignations_vehicules.matricule_resource=resources.matricule_resource ' +
                        'INNER JOIN semaines ON semaines.id = assignations_vehicules.id_semaine ' +
                        'WHERE assignations_vehicules.id_semaine = ? AND resources.type="SALARIE" ' +
                        'GROUP BY assignations_vehicules.matricule_resource',
                        [req.params.idSemaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
                                res.json(false)
                            } else
                                res.json(results);
                        })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })



    app.delete('/api/vehicules/supression/:immatriculation/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_VEHICULES', token)) {
                    bdd.query('DELETE FROM assignations_vehicules WHERE immatriculation=? AND id_semaine=?',
                        [req.params.immatriculation, req.params.semaine], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getNBsemaine(printSemaines(), req.params.semaine)
                                    log("Suppression attributions du véhicule " + req.params.immatriculation + ' sur la semaine '
                                        + date, 'Planning Véhicules', user.id)
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

    app.post('/api/vehicules/modifier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            }
            else{
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_VEHICULES', token)) {
                    if (req.body.listDelete.length == 0 && req.body.listAttributions.length == 0) {

                        res.send(false);
                    } else {
                        var err = false;
                        if (req.body.listDelete.length > 0) {

                            req.body.listDelete.forEach((el) => {
                                bdd.query('DELETE FROM assignations_vehicules WHERE id_semaine = ? AND jour = ? AND immatriculation = ? AND matricule_resource = ?',
                                    [el.idSemaine, el.jour, el.immatriculation, el.matricule_resource],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Véhicules', user.id)
                                            err = true;
                                        }
                                    });
                            });
                        }
                        if (req.body.listAttributions.length > 0) {
                            req.body.listAttributions.forEach((el) => {
                                bdd.query('INSERT INTO assignations_vehicules (immatriculation, chauffeur, jour, id_semaine, ' +
                                    'matricule_resource) VALUES (?, ?, ?, ?, ?)',
                                    [el.immatriculation, el.chauffeur, el.jour, el.idSemaine, el.matricule_resource],
                                    function (error, results2, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Planning Véhicules', user.id)
                                            err = true;
                                        }
                                    })
                            });
                        }

                        res.send(!err);
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });
    app.post('/api/assignationsvehicules/copiersemaine/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;

                    bdd.query('DELETE FROM assignations_vehicules WHERE id_semaine = ?',
                        [semaine],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                res.json(false)
                            } else {
                                bdd.query('SELECT * FROM assignations_vehicules WHERE id_semaine = ?',
                                    [semaineAcopier],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Rendez-Vous Chantier', user.id)
                                            res.json(false)
                                        } else if (results.length !== 0) {
                                            var req = 'INSERT INTO assignations_vehicules (immatriculation,chauffeur,jour,id_semaine,' +
                                                'matricule_resource) VALUES '
                                            var args = []
                                            for (let ass of results) {
                                                req += '(?,?,?,?,?) ' + (results.indexOf(ass) != results.length - 1 ? ',' : '')
                                                args.push(ass.immatriculation);
                                                args.push(ass.chauffeur);
                                                args.push(ass.jour);
                                                args.push(semaine);
                                                args.push(ass.matricule_resource);
                                            }
                                            bdd.query(req, args, function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Planning Véhicules', user.id)
                                                    res.json(false)
                                                } else {
                                                    if (printLogLevel() >= 1) {
                                                        var date = getNBsemaine(printSemaines(), semaine)
                                                        log("Copier les attributions véhicules de la semaine précédent la semaine " +
                                                            date, 'Planning Véhicules', user.id)
                                                    }
                                                    res.json(results);
                                                }
                                            })
                                        } else
                                            res.json(true)
                                    })
                            }
                        });

                }
                else
                    res.json('SECURITY_ERROR');

            }
        });
    });




    app.post('/api/vehicules/creation_assignation', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            }
            else{
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_VEHICULES', token)) {
                    var immatriculation = req.body.immatriculation;
                    var chauffeur = req.body.chauffeur;
                    var jour = req.body.jour;
                    var id_semaine = req.body.id_semaine;
                    var matricule_resource = req.body.matricule_resource;
                    if (immatriculation !== '' && chauffeur !== '' && jour !== '' && id_semaine !== '' && matricule_resource !== '') {
                        bdd.query('INSERT INTO assignations_vehicules (immatriculation, chauffeur, jour, id_semaine,' +
                            'matricule_resource) VALUES (?, ?, ?,?,?)',
                            [immatriculation, chauffeur, jour, id_semaine, matricule_resource],
                            function (error, results2, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Planning Véhicules', user.id)
                                    res.json(false)
                                } else {
                                    if (printLogLevel() >= 1) {
                                        var date = getNBsemaine(printSemaines(), id_semaine, jour)
                                        log("Ajout attribution véhicule " + req.body.immatriculation + ' à ' +
                                            req.body.matricule_resource + ' le ' + date, 'Planning Véhicules', user.id)
                                    }
                                    res.json(results2);
                                }
                            })
                    } else {
                        res.send(false)
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })

    //Modifier des assignations_vehicules
    app.put('/api/vehicules/modifier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            }
            else if(req.body.immatriculation!='' && ([0,1,2,3,4,5]).indexOf(req.body.jour)!=-1
                && req.body.id_semaine!='' && req.body.old_matricule_resource!='') {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_VEHICULES', token)) {
                    var re = "UPDATE assignations_vehicules SET ";
                    var args = [];
                    if (req.body.chauffeur != '') {
                        re += "chauffeur = ? ";
                        args.push(req.body.chauffeur);
                    } else {
                        re += "chauffeur = chauffeur ";
                    }
                    if (req.body.matricule_resource != '') {
                        re += ", matricule_resource = ? ";
                        args.push(req.body.matricule_resource);
                    }
                    re += "WHERE immatriculation = ? AND jour= ? AND id_semaine = ? AND matricule_resource = ? ";
                    args.push(req.body.immatriculation);
                    args.push(req.body.jour);
                    args.push(req.body.id_semaine);
                    args.push(req.body.old_matricule_resource);
                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Planning Véhicules', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1) {
                                var date = getNBsemaine(printSemaines(), req.body.id_semaine, req.body.jour)
                                log("Modification attribution véhicule " + req.body.immatriculation + ' à ' +
                                    req.body.matricule_resource + ' le ' + date, 'Planning Véhicules', user.id)
                            }
                            res.json(results);
                        }
                    });

                } else
                    res.send(false);
            }
            else
                res.json('SECURITY_ERROR');
        });
    });

    app.delete('/api/vehicules/supression_assignation/:immatriculation/:semaine/:jour/:matricule_resource', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            }else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'M_VEHICULES', token)) {
                    bdd.query('DELETE FROM assignations_vehicules WHERE immatriculation=? AND id_semaine=?' +
                        'AND jour=? AND matricule_resource=?',
                        [req.params.immatriculation, req.params.semaine, req.params.jour, req.params.matricule_resource],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
                                res.json(false)
                            } else {
                                if (printLogLevel() >= 1) {
                                    var date = getNBsemaine(printSemaines(), req.params.semaine, req.params.jour)
                                    log("Suppression attribution du véhicule " + req.body.immatriculation + ' à ' +
                                        req.body.matricule_resource + ' le ' + date, 'Planning Véhicules', user.id)
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


    app.get('/api/vehicules/assignations/:idSemaine/:code_chantier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Planning Véhicules', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'M_VEHICULES', token)) {
                    bdd.query('SELECT resources.Nom, assignations.jour, vehicules.immatriculation,' +
                        'assignations.matricule_resource FROM assignations ' +
                        'INNER JOIN semaines ON semaines.id= assignations.id_semaine  AND semaines.id= ? ' +
                        'LEFT JOIN resources ON resources.matricule_resource=assignations.matricule_resource ' +
                        'LEFT JOIN vehicules ON resources.matricule_resource=vehicules.chauffeur ' +
                        'WHERE code_chantier = ? ORDER BY resources.Nom ASC',
                        [req.params.idSemaine, req.params.code_chantier], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Planning Véhicules', user.id)
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


    //copier coller semaine prec
    app.post('/api/vehicules/copierSem/:matricule/:semaineAcopier/:semaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Rendez-Vous Chantier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'special', 'M_VEHICULES', token)) {
                    var semaineAcopier = req.params.semaineAcopier;
                    var semaine = req.params.semaine;

                    var matricule = req.params.matricule;
                    const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);

                    bdd.query('DELETE FROM assignations_vehicules WHERE id_semaine = ? AND immatriculation = ?',
                        [semaine, matricule],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur_1 : " + error, 'Véhicules', user.id)
                                res.json(false)
                            } else {
                                bdd.query('SELECT * FROM assignations_vehicules WHERE id_semaine = ? AND immatriculation = ?',
                                    [semaineAcopier, matricule],
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur_2 : " + error, 'Véhicules', user.id)
                                            res.json(false)
                                        } else {
                                            var req = 'INSERT INTO assignations_vehicules (immatriculation,chauffeur,id_semaine,jour, ' +
                                                'matricule_resource) VALUES '
                                            var args = []
                                            for (let ass of results) {
                                                req += '(?,?,?,?,?) ' + (results.indexOf(ass) != results.length - 1 ? ',' : '')
                                                args.push(matricule);
                                                args.push(ass.chauffeur);
                                                args.push(semaine);
                                                args.push(ass.jour);
                                                args.push(ass.matricule_resource);
                                            }

                                            bdd.query(req, args, function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur_3 : " + error, 'Véhicules', user.id)
                                                    res.json(false)
                                                } else {
                                                    if (printLogLevel() >= 1) {
                                                        var date = getNBsemaine(printSemaines(), semaine)
                                                        log("Copier les assignations véhicule de la semaine précédent la semaine " +
                                                            date + " pour le véhicule " + matricule, 'Véhicules', user.id)
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

}
