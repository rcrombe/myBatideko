module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,setLogLevel,semaine) {

    app.get('/api/historique/utilisateurs', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Historique', null);
                res.send(false);
            } else {
                var date = req.params.date;
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_HISTORIQUE', token)) {
                    bdd.query("SELECT * FROM utilisateurs ",
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Historique', user.id)
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

    app.get('/api/historique/:matricule_resource/:date_debut/:date_fin/:module/:action', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Historique', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'A_HISTORIQUE', token)) {
                    var requete = ''
                    var args = (req.params.matricule_resource === 'NULL' || req.params.matricule_resource === 'rien'
                        ? [req.params.date_debut, req.params.date_fin] :
                        [req.params.matricule_resource, req.params.date_debut, req.params.date_fin]);
                    if (req.params.action !== 'rien') {
                        args.push('%' + req.params.action + '%')
                        requete += "AND description LIKE ? "
                    }
                    if (req.params.date_début === null)
                        res.json(error)
                    if (req.params.date_fin === null)
                        res.json(error)
                    if (req.params.matricule_resource === null)
                        req.params.matricule_resource = 'id_utilisateur'
                    if (req.params.module !== 'rien') {
                        requete += ' AND module=? '
                        args.push(req.params.module)
                    }

                    //const user = jsonWebToken.decode(req.headers.authorization.split(' ')[1]);
                    bdd.query("SELECT * FROM `historique`  " +
                        "LEFT JOIN utilisateurs ON utilisateurs.id=historique.id_utilisateur " +
                        "WHERE " + (req.params.matricule_resource === 'NULL' ? " id_utilisateur IS NULL AND " :
                            (req.params.matricule_resource === 'rien' ? '' : "id_utilisateur=? AND ")) +
                        " date BETWEEN ? AND ? " + requete + " ORDER BY date DESC", args,
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Historique', user.id)
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

    //creation action de l'historique
    app.put('/api/historique/loglevel', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Historique', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'A_HISTORIQUE', token)) {
                    bdd.query('UPDATE parametres SET loglevel=? ', [req.body.loglevel],
                        function (error, results, fields) {
                            if (error) {
                                throw error;
                            } else {
                                if (printLogLevel() >= 1)
                                    log("Modification du niveau de détails de l'hitorique : " + req.body.loglevel,
                                        'Historique', user.id)
                                setLogLevel(req.body.loglevel)
                                loglevel = printLogLevel()
                                var token = jsonWebToken.sign({
                                        id: req.body.utilisateur.id,
                                        nom: req.body.utilisateur.nom,
                                        prenom: req.body.utilisateur.prenom,
                                        email: req.body.utilisateur.email,
                                        telephone: req.body.utilisateur.telephone,
                                        poste: req.body.utilisateur.poste,
                                        role: req.body.utilisateur.role,
                                        voiture_marque: req.body.utilisateur.voiture_marque,
                                        voiture_modele: req.body.utilisateur.voiture_modele,
                                        voiture_couleur: req.body.utilisateur.voiture_couleur,
                                        loglevel: req.body.utilisateur.loglevel
                                    },
                                    webTokenKey,
                                    {expiresIn: '8h'});
                                res.json(token);
                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        })
    })
}