module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, log, printLogLevel, printSemaines,
    getNBsemaine, getDate) {

    // Connexion
    app.post('/api/login', function (req, res) {
        var login = req.body.login;

        if (req.body.login.indexOf('@') == -1)
            login = login + '@batideko.fr';

        bdd.query('SELECT utilisateurs.id, nom, prenom, email, telephone, password, poste, role, voiture_marque, voiture_modele, ' +
            'voiture_couleur,loglevel,nav_id,electricien,id_resource FROM utilisateurs,parametres WHERE email=?',
            [login], function (error, result, fields) {
                if (error) {
                    log("Erreur : " + error, 'Connexion', null)
                    res.send(false)
                }
                if (result.length == 0) {
                    res.send(false);
                } else {
                    bcrypt.compare(req.body.motdepasse, result[0].password, function (err, test) {
                        if (test) {
                            bdd.query('SELECT module_id, r, w, special FROM permissions WHERE groupe_id = ?',
                                [result[0].role], function (error, permissions, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Connexion', null)
                                        res.send(false)
                                    } else {
                                        var token = jsonWebToken.sign({
                                            id: result[0].id,
                                            nom: result[0].nom,
                                            prenom: result[0].prenom,
                                            email: result[0].email,
                                            telephone: result[0].telephone,
                                            poste: result[0].poste,
                                            role: result[0].role,
                                            voiture_marque: result[0].voiture_marque,
                                            voiture_modele: result[0].voiture_modele,
                                            voiture_couleur: result[0].voiture_couleur,
                                            loglevel: result[0].loglevel,
                                            nav_id: result[0].nav_id,
                                            electricien: result[0].electricien,
                                            permissions: permissions,
                                            id_resource: result[0].id_resource
                                        },
                                            webTokenKey,
                                            { expiresIn: '12h' });

                                        SECURITY.insertLoggedUser(token);

                                        if (result[0].loglevel >= 2)
                                            log('Connexion', 'Connexion', result[0].id)
                                        res.json({ token: token });
                                    }
                                });

                        } else {
                            res.json(false);
                        }
                    })
                }
            });
    });

    // Inscription
    app.post('/api/register', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Utilisateurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_USERS', token)) {
                    var enc_passwd = '';

                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            enc_passwd = hash;

                            console.log(enc_passwd);
                            bdd.query('INSERT INTO utilisateurs (nom, prenom, email, password, poste, role) ' +
                                'VALUES (?, ?, ?, ?, ?, ?)',
                                [req.body.nom, req.body.prenom, req.body.email, enc_passwd, req.body.poste, req.body.role],
                                function (error, results, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                        res.json(false)
                                    } else {
                                        if (printLogLevel() >= 1) {
                                            log("Ajout utilisateur " + req.body.nom + ' ' + req.body.prenom,
                                                'Gestion Utilisateurs', user.id)
                                        }
                                        res.json(results);
                                    }
                                });
                        });
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    //Liste des resources
    app.get('/api/users/resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Resources', null);
                res.send(false);
            } else {
                const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                bdd.query('SELECT * FROM resources WHERE Actif = 1 ORDER BY Nom ASC ', function (error, results, fields) {
                    if (error) {
                        log("Erreur : " + error, 'Resources', user.id)
                        res.json(false)
                    } else
                        res.json(results);
                })
            }
        })
    });

    // Suppression d'un utilisateur
    app.delete('/api/users/:id', function (req, res) {
        console.log("Trying to remove : " + req.params.id);
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Utilisateurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_USERS', token)) {
                    console.log()
                    bdd.query('DELETE FROM utilisateurs WHERE id=?', [req.params.id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                            res.json(false)
                        }
                        else {
                            if (printLogLevel() >= 1) {
                                log("Suppression utilisateur " + req.params.id,
                                    'Gestion Utilisateurs', user.id)
                            }
                            res.json(results);
                        }
                    });
                }
                else
                    res.send(false);

            }
        });
    });

    // Modification
    app.put('/api/users/edit', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Utilisateurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_USERS', token)) {
                    var re = "UPDATE utilisateurs SET ";
                    var args = [];

                    if (req.body.nom != '') {
                        re += "nom = ? ";
                        args.push(req.body.nom);
                    } else {
                        re += "nom = nom ";
                    }
                    if (req.body.prenom != '') {
                        re += ", prenom = ? ";
                        args.push(req.body.prenom);
                    }
                    if (req.body.email != '') {
                        re += ", email = ? ";
                        args.push(req.body.email);
                    }
                    if (req.body.poste != '') {
                        re += ", poste = ? ";
                        args.push(req.body.poste);
                    }
                    if (req.body.role != '') {
                        re += ", role = ? ";
                        args.push(req.body.role);
                    }
                    if (req.body.nav_id != '') {
                        re += ", nav_id = ? ";
                        args.push(req.body.nav_id);
                    }
                    if (req.body.id_resource != '') {
                        re += ", id_resource = ? ";
                        args.push(req.body.id_resource);
                    }
                    /*if(req.body.password !== false){


                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(req.body.password, salt, function(err, hash) {
                                enc_passwd = hash;

                                re += ", password = ? ";
                                args.push(enc_passwd);

                                re += "WHERE id = ?";
                                args.push(req.body.id);
                                console.log(re);
                                bdd.query(re, args, function (error, results, fields) {
                                    if (error) throw error;
                                    res.json(results);
                                });
                            });
                        });
                    }*/
                    re += "WHERE id = ?";
                    args.push(req.body.id);
                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1) {
                                log("Modification utilisateur " + req.body.nom + ' ' + req.body.prenom,
                                    'Gestion Utilisateurs', user.id)
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

    app.get('/api/gestion_utilisateurs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Utilisateurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'r', 'A_GESTION_USERS', token)) {
                    bdd.query('SELECT id, nom, prenom, email, telephone, poste, role, nav_id, id_resource FROM utilisateurs',
                        function (error, users, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                res.json(false)
                            }
                            else {
                                var callback = [];

                                bdd.query('SELECT A.user_id, A.alert_id, A.enabled FROM alerts_utilisateurs A, alerts_store AST WHERE AST.id = A.alert_id ORDER BY A.user_id, A.alert_id',
                                    function (error, results, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                            res.json(false)
                                        }
                                        else {
                                            users.forEach((el) => {
                                                var e = el;
                                                e.alertes = [];

                                                results.forEach((alert) => {
                                                    if (alert.user_id == el.id)
                                                        e.alertes.push(alert);
                                                });

                                                callback.push(e);
                                            });

                                            res.json(callback);

                                        }
                                    });
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            };
        });
    });


    app.post('/api/utilisateurs/alertes', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_USERS', token)) {
                    var alerte_id = req.body.alerte_id;
                    var user_id = req.body.user_id;
                    var val = req.body.val;

                    var request = 'UPDATE alerts_utilisateurs SET enabled = ? WHERE alert_id = ? AND user_id = ?';

                    bdd.query(request, [val, alerte_id, user_id], function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                            res.json(false)
                        }
                        else {
                            log("Modification de l'affichage des alertes " + alerte_id + " Valeur : " + val + " Utilisateur : " + user_id, 'Gestion Utilisateurs', user.id);

                            res.json(true);
                        }
                    });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


    // Modification
    app.put('/api/users/_change', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Gestion Utilisateurs', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if (SECURITY.canAccessRessource(user, 'w', 'A_GESTION_USERS', token)) {

                    if (req.body._data_ != '') {

                        var re = "UPDATE utilisateurs SET password = ? WHERE id = ?";
                        bcrypt.genSalt(10, function (err, salt) {
                            bcrypt.hash(req.body._data_, salt, function (err, hash) {
                                enc_passwd = hash;

                                console.log(re);
                                bdd.query(re, [enc_passwd, req.body.id], function (error, results, fields) {
                                    if (error) {
                                        log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                                        res.json(false)
                                    } else {
                                        if (printLogLevel() >= 1) {
                                            log("Modification Password " + req.body.nom + ' ' + req.body.prenom,
                                                'Gestion Utilisateurs', user.id)
                                        }
                                        res.json(results);
                                    }
                                });
                            });
                        });

                    }
                    else
                        res.send(false);

                    /*
                    re += "WHERE id = ?";
                    args.push(req.body.id);
                    bdd.query(re, args, function (error, results, fields) {
                        if (error) {
                            log("Erreur : " + error, 'Gestion Utilisateurs', user.id)
                            res.json(false)
                        } else {
                            if (printLogLevel() >= 1) {
                                log("Modification utilisateur " + req.body.nom + ' ' + req.body.prenom,
                                    'Gestion Utilisateurs', user.id)
                            }
                            res.json(results);
                        }
                    });*/
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


}