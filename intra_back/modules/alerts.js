module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,printSemaines,
                           getNBsemaine,getDate) {

    //obtenir les absences
    app.get('/api/notifications', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Notifications', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_NOTIFICATIONS', token)) {
                    bdd.query("SELECT A.*, M.moduleUrl as url FROM alerts A, modules M WHERE A.user_id = ? AND A.module_id = M.moduleId ORDER BY A.date DESC",[user.id],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Notifications', user.id)
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
    app.get('/api/notifications/count', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Notifications', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_NOTIFICATIONS', token)) {
                    bdd.query("SELECT COUNT(A.id) as nb_notifications FROM alerts A WHERE A.user_id = ?",[user.id],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Notifications', user.id)
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

    app.get('/api/notifications/navbar', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Notifications', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_NOTIFICATIONS', token)) {
                    bdd.query("SELECT A.*, M.moduleUrl as url FROM alerts A, modules M WHERE A.user_id = ? AND A.module_id = M.moduleId ORDER BY A.date DESC LIMIT 3",[user.id],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Notifications', user.id)
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

    app.post('/api/notifications/acquiter', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Notifications', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_NOTIFICATIONS', token)) {
                    bdd.query("DELETE FROM alerts WHERE user_id = ? AND id = ?",[user.id, req.body.id],
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Notifications', user.id)
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

}
