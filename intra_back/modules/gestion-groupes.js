module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,
                           printLogLevel,setLogLevel,printSemaines,getNBsemaine,getDate){
    const loglevel = printLogLevel();

//semaine actuelle id et numéro
    app.get('/api/gestion_groupes', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_GROUPES', token)) {
                    bdd.query('SELECT DISTINCT G.*, (select count(*) from utilisateurs where role = G.id) as nbMembres ' +
                        'FROM groupes G ',
                        function (error, groups, fields) {
                            if (error) throw error;
                            var callback = [];

                            bdd.query('SELECT M.moduleName, M.moduleId, P.r, P.w, P.special, P.groupe_id FROM modules M, permissions P WHERE P.module_id = M.moduleId ',
                                function (error, results, fields) {
                                    if (error) throw error;
                                    groups.forEach((el) => {
                                        var e = el;
                                        e.permissions = [];

                                        results.forEach((perm) => {
                                            if (perm.groupe_id == el.id)
                                                e.permissions.push(perm);
                                        });

                                        callback.push(e);
                                    });

                                    res.json(callback);
                                });
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.post('/api/gestion_groupes/new', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_GROUPES', token)) {
                    if(req.body.nom.length > 0){
                        var name = req.body.nom;
                        var admin = req.body.admin ? '1':'0';

                        bdd.query('INSERT INTO groupes (name, administrateur) VALUES (?, ?) ', [name, admin], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Groupes', user.id)
                                res.json(false)
                            }
                            else{
                                console.log(results);
                                var insertedId = results.insertId;

                                bdd.query('SELECT * from modules ', function (error, modules, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Gestion Groupes', user.id)
                                        res.json(false)
                                    }
                                    else{
                                        modules.forEach((el) => {
                                            bdd.query('INSERT INTO permissions (groupe_id, module_id) VALUES (?, ?) ', [insertedId, el.moduleId], function (error, results, fields) {
                                                if (error) {
                                                    log("Erreur : " + error, 'Gestion Groupes', user.id)
                                                    res.json(false)
                                                } else {
                                                    console.log('Created : GID ' + insertedId + ' for MID ' + el.moduleId);
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                    res.json(true);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.post('/api/gestion_groupes/permissions', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_GESTION_GROUPES', token)) {
                    var module_id = req.body.module_id;
                    var groupe_id = req.body.groupe_id;
                    var val = req.body.val;

                    var request = null;

                    if(req.body.perm == 'r')
                        request = 'UPDATE permissions SET r = ? WHERE module_id = ? AND groupe_id = ?';
                    else if(req.body.perm == 'w')
                        request = 'UPDATE permissions SET w = ? WHERE module_id = ? AND groupe_id = ?';
                    else if(req.body.perm == 'special')
                        request = 'UPDATE permissions SET special = ? WHERE module_id = ? AND groupe_id = ?';
                    else
                        res.json(false);

                    if(request != null){
                        bdd.query(request, [val, module_id, groupe_id], function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Groupes', user.id)
                                res.json(false)
                            }
                            else{

                                if(req.body.perm == 'r')
                                    log("Modification du droit en lecture sur le module " + module_id + " Valeur : " + val + " Groupe : " + groupe_id, 'Gestion Groupes', user.id);
                                else if(req.body.perm == 'w')
                                    log("Modification du droit en écriture sur le module " + module_id + " Valeur : " + val + " Groupe : " + groupe_id, 'Gestion Groupes', user.id);
                                else if(req.body.perm == 'special')
                                    log("Modification du droit en spécial sur le module " + module_id + " Valeur : " + val + " Groupe : " + groupe_id, 'Gestion Groupes', user.id);

                                SECURITY.loadModulesPermissions();

                                res.json(true);
                            }
                        });
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


    //suppression d'un groupe
    app.delete('/api/gestion_groupes/remove/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Groupes', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_GESTION_GROUPES', token)) {
                    bdd.query("DELETE FROM groupes WHERE id=?", [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Groupes', user.id);
                            res.json(false);
                        } else {
                            log("Suppression du groupe " + req.params.id, 'Gestion Groupes', user.id);
                            res.json(results);
                        }
                    })
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    });
}
