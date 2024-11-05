module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,printSemaines,
                           getNBsemaine,getDate,sendMail) {

    const countChantiers = (chantiers) => {
        var t_chantiers = [];

        chantiers.forEach((el) => {
            const p = (e) => e == el;

            if(t_chantiers.findIndex(p) == -1)
                t_chantiers.push(el);
        });

        return t_chantiers.length;
    }

    //Liste attributs
    app.get('/api/pointages-atelier/pointages/:statut', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER', token)) {

                    var statut = req.params.statut;
                    var args = [statut];

                    var sec = '';

                    if(!SECURITY.canAccessRessource(user, 'special', 'M_CREATION_POINTAGES_ATELIER', token)
                        && !SECURITY.canAccessRessource(user, 'special', 'M_POINTAGES_ATELIER', token)){
                        sec = 'and R.matricule_resource = ? ';
                        args.push(user.id_resource);
                    }

                    if(statut == 'NIVEAU1'){
                        sec += "or PA.statut = 'BROUILLON' ";
                    }


                    if(statut == 'NIVEAU1' || statut == 'NIVEAU2' || statut == 'VALIDE') {

                        bdd.query('SELECT PA.*, PAL.*, U.nom as nom_auteur, U.prenom as prenom_auteur, R.Nom as nom_resource, CA.nom as nom_ouvrage, C.nom_chantier, C.zone, PAA.* FROM pointages_atelier PA \n' +
                            'INNER JOIN pointages_atelier_lignes PAL ON PA.id = PAL.id_pointage\n' +
                            'INNER JOIN resources R ON PA.matricule_resource = R.matricule_resource\n' +
                            'INNER JOIN chantiers C ON PAL.code_chantier = C.code_chantier\n' +
                            'INNER JOIN pointages_atelier_actions PAA ON PAA.id = PAL.code_action\n' +
                            'INNER JOIN utilisateurs U ON PA.auteur = U.id\n' +
                            'LEFT JOIN chantiers_atelier CA ON CA.id = PAL.code_ouvrage\n' +
                            'WHERE PA.statut = ? ' + sec +
                            'ORDER BY PA.date DESC',args,
                            function (error, pointages, fields) {
                                if (error) {
                                    log("Erreur : " + error, 'Pointages Atelier', user.id)
                                    res.json(false)
                                } else {
                                    res.json(pointages);
                                }
                            });
                    }
                    else {
                        console.log(statut);
                        res.json(false);
                    }
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });

    app.get('/api/pointages-atelier/noms_chantiers', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER', token)) {
                    bdd.query('SELECT code_chantier, nom_chantier, zone FROM chantiers ' +
                        'WHERE Actif=1 AND (code_chantier LIKE "CC%" OR code_chantier LIKE "CA%" OR  ' +
                        'code_chantier = "_ATELIER" or code_chantier = "_BUREAUX" or code_chantier = "_TRAVAUX_EPI" or ' +
                        'code_chantier = "_REUNION" or code_chantier = "_MEDECINE" or code_chantier = "_CHARGEMENT" or code_chantier = "CPAM CAMBRAI" or ' +
                        'code_chantier = "_EPI_MAINTENANCE" or code_chantier = "_EPI_CONSTRUCTION" or ' +
                        'code_chantier = "CPAM MAUBEUGE" or code_chantier = "CPAM VALENCIENNES" )' +
                        'ORDER BY nom_chantier ASC ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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

    app.get('/api/pointages-atelier/ressources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER', token)) {

                    var sec = SECURITY.canAccessRessource(user, 'special', 'M_CREATION_POINTAGES_ATELIER', token) ? '':('and matricule_resource = ?');
                    var sec_args = SECURITY.canAccessRessource(user, 'special', 'M_CREATION_POINTAGES_ATELIER', token) ? []:[user.id_resource];

                    bdd.query('select matricule_resource, Nom from resources where Actif = 1 and Activite = \'3.50-ATELIER\' ' + sec,sec_args,
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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

    app.get('/api/pointages-atelier/ouvrages', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER', token)) {
                    bdd.query('SELECT id, Nom, code_chantier from chantiers_atelier where Actif = 1 ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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

    app.get('/api/pointages-atelier/actions', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER', token)) {
                    bdd.query('SELECT id, nom_action from pointages_atelier_actions ',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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

    app.post('/api/pointages-atelier/creerPointage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_ATELIER_USER', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_ATELIER', token)) {

                    if(SECURITY.canAccessRessource(user, 'special', 'M_CREATION_POINTAGES_ATELIER', token)
                        || (
                            !SECURITY.canAccessRessource(user, 'special', 'M_CREATION_POINTAGES_ATELIER', token)
                            && req.body.ressource == user.id_resource
                        ))
                    {
                        if(req.body.heure_debut < req.body.heure_fin && (new Date(req.body.date)) <= (new Date())){
                            var req_chantiers_where = "(";
                            var req_chantiers_args = [];

                            var req_actions_where = "(";
                            var req_actions_args = [];

                            var req_ouvrages_where = "(";
                            var req_ouvrages_args = [];

                            var req_lines = '';
                            var req_lines_args = [];

                            var statut = req.body.verifDuree == true ? 'NIVEAU1' : 'BROUILLON';

                            for(var x = 0; x < req.body.lignes.length; x++){
                                req_chantiers_where += '?';

                                req_chantiers_args.push(req.body.lignes[x].chantier);

                                if(x+1 != req.body.lignes.length)
                                    req_chantiers_where += ', ';
                                else
                                    req_chantiers_where += ')';

                                req_lines += '(?, ?, ?, ?, ?, ?)';

                                if(x+1 != req.body.lignes.length)
                                    req_lines += ', ';


                                const p = (e) => e == req.body.lignes[x].action;

                                if(req_actions_args.findIndex(p) == -1)
                                    req_actions_args.push(req.body.lignes[x].action);

                                if(req.body.lignes[x].ouvrage != ''){
                                    const p_ouvrages = (e) => e == req.body.lignes[x].ouvrage;

                                    if(req_ouvrages_args.findIndex(p_ouvrages) == -1)
                                        req_ouvrages_args.push(req.body.lignes[x].ouvrage);
                                }
                            }

                            for(var i = 0; i < req_actions_args.length; i++){
                                req_actions_where += '?';

                                if(i+1 != req_actions_args.length)
                                    req_actions_where += ', ';
                                else
                                    req_actions_where += ')';
                            }

                            for(var i = 0; i < req_ouvrages_args.length; i++){
                                req_ouvrages_where += '?';

                                if(i+1 != req_ouvrages_args.length)
                                    req_ouvrages_where += ', ';
                                else
                                    req_ouvrages_where += ')';
                            }

                            if(req_ouvrages_args.length == 0){
                                req_ouvrages_where += '\'\')';
                            }

                            //console.log("select * from chantiers where code_chantier IN " + req_chantiers_where)
                            //console.log(req_chantiers_args)

                            bdd.query("select * from chantiers where code_chantier IN " + req_chantiers_where, req_chantiers_args,
                                function(error, chantiers, fields){
                                    if(error){
                                        log("Error : SQL " + error, 'Pointages Atelier', user.id);
                                    }
                                    else {
                                        //console.log(chantiers)

                                        if(chantiers.length > 0 && chantiers.length == countChantiers(req_chantiers_args))
                                        {
                                            bdd.query("select * from resources where matricule_resource = ?", [req.body.ressource],
                                                function (error, resources, fields) {
                                                    if (error) {
                                                        log("Error _ 1 : SQL " + error, "Pointages Atelier", user.id);
                                                    } else {
                                                        if(resources.length > 0){
                                                            bdd.query("select * from pointages_atelier_actions where id IN " + req_actions_where, req_actions_args,
                                                                function(error, actions, fields) {
                                                                    if (error) {
                                                                        log("Error _ 2 : SQL " + error, "Pointages Atelier", user.id);
                                                                    } else {
                                                                        if (actions.length > 0 && actions.length == req_actions_args.length) {
                                                                            bdd.query("select * from chantiers_atelier where id IN " + req_ouvrages_where, req_ouvrages_args,
                                                                                function(error, ouvrages, fields) {
                                                                                    if (error) {
                                                                                        log("Error _ 3 : SQL " + error, "Pointages Atelier", user.id);

                                                                                        console.log(req_ouvrages_where)
                                                                                        console.log(req_ouvrages_args)
                                                                                    } else {
                                                                                        if (ouvrages.length == req_ouvrages_args.length) {

                                                                                            bdd.query("INSERT INTO pointages_atelier (matricule_resource, date, heure_debut, heure_fin, auteur, statut) VALUES (?, ?, ?, ?, ?, ?)",
                                                                                                [req.body.ressource, req.body.date, req.body.heure_debut, req.body.heure_fin, user.id, statut],
                                                                                                function(error, results, fields) {
                                                                                                    if (error) {
                                                                                                        log("Error _ 4 : SQL " + error, "Pointages Atelier", user.id);
                                                                                                    } else {
                                                                                                        if(req.body.lignes.length > 0){
                                                                                                            var req_lines = '';
                                                                                                            var req_lines_args = [];

                                                                                                            for(var x = 0; x < req.body.lignes.length; x++){
                                                                                                                req_lines += '(?, ?, ?, ?, ?, ?)';

                                                                                                                if(x+1 != req.body.lignes.length)
                                                                                                                    req_lines += ', ';

                                                                                                                req_lines_args.push(results.insertId);
                                                                                                                req_lines_args.push(req.body.lignes[x].chantier);
                                                                                                                req_lines_args.push(req.body.lignes[x].ouvrage != '' ? req.body.lignes[x].ouvrage:null);
                                                                                                                req_lines_args.push(req.body.lignes[x].action);
                                                                                                                req_lines_args.push((((new Date("01/01/2023 "+req.body.lignes[x].duree + ':00').getTime()) - (new Date("01/01/2023 00:00:00").getTime()))/1000));
                                                                                                                req_lines_args.push(req.body.lignes[x].commentaire != '' ? req.body.lignes[x].commentaire:null);
                                                                                                            }

                                                                                                            bdd.query("INSERT INTO pointages_atelier_lignes (id_pointage, code_chantier, code_ouvrage, code_action, duree, commentaire) VALUES " + req_lines,
                                                                                                                req_lines_args,
                                                                                                                function(error, results, fields) {
                                                                                                                    if (error) {
                                                                                                                        log("Error _ 5 : SQL " + error, "Pointages Atelier", user.id);

                                                                                                                    } else {
                                                                                                                        console.log(results)

                                                                                                                        res.json("OK")
                                                                                                                    }
                                                                                                                });
                                                                                                        }
                                                                                                        else
                                                                                                            console.log("Pogn't")
                                                                                                    }
                                                                                                });
                                                                                        }
                                                                                        else
                                                                                            console.log("Counter POG");
                                                                                    }
                                                                                });
                                                                        }
                                                                    }
                                                                });
                                                        } else {
                                                            console.log("Sending exception !");
                                                            res.json(false);
                                                        }
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
                        else {
                            log('Mauvais horaires lors de la création du pointage', 'Pointages Atelier', user.id);
                            res.json(false)
                        }
                    }
                    else
                        res.json('SECURITY_ERROR');
                }
                else
                    res.json('SECURITY_ERROR');

            }
        })
    })


    app.delete('/api/pointages-atelier/supprimerPointage/:id', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'special', 'M_POINTAGES_ATELIER_USER', token) || SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_ATELIER', token)) {

                    bdd.query('SELECT * FROM pointages_atelier WHERE id = ?',
                        [req.params.id],
                        function (error, r, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
                                res.json(false)
                            } else {
                                log("SUPPRESSION DE POINTAGE : " + JSON.stringify(r), 'Pointages', user.id);

                                bdd.query("DELETE FROM pointages_atelier WHERE id = ?", [req.params.id], function (error, result, fileds) {
                                    if (error) {
                                        log("Erreur : " + error, 'Pointages Atelier', user.id)
                                        res.json(false)
                                    } else {
                                        res.json('OK');
                                    }
                                });

                                if (r.length > 0 && r[0].original != null) {
                                    bdd.query("DELETE FROM pointages_atelier_origine WHERE id = ?", [req.params.id], function (error, result, fileds) {
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

    app.put('/api/pointages-atelier/allModifEtat', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            }
            else if(req.body.etat=== null)
                res.json(false)
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_ATELIER', token)) {
                    console.log('POG')
                    if (req.body.id > 0 && (req.body.statut == 'NIVEAU1' || req.body.statut == 'NIVEAU2' || req.body.statut == 'VALIDE')) {
                        console.log('POG2')
                        bdd.query("SELECT R.Nom FROM resources R, pointages_atelier PA WHERE R.matricule_resource = PA.matricule_resource AND PA.id = ?", [req.body.id], function (error, resources, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
                            }
                            else {
                                console.log('POG3')
                                if(resources.length > 0) {
                                    console.log('POG4')
                                    bdd.query("UPDATE pointages_atelier SET statut = ? WHERE id = ?", [req.body.statut, req.body.id], function (error, update, fields) {
                                        if (error) {
                                            log("Erreur : " + error, 'Pointages Atelier', user.id)
                                        }
                                        else {
                                            log("A validé les pointages de " + resources[0].Nom, 'Pointages Atelier', user.id);
                                            res.json('OK');
                                        }
                                    });
                                }
                            }
                        });
                    }
                    else
                        res.json(false);
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


    app.put('/api/pointages-atelier/modifierPointage', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages Atelier', null);
                res.send(false);
            }
            else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_ATELIER', token)) {
                    console.log(req.body);

                    bdd.query('SELECT PA.*, PAL.*, PAA.* FROM pointages_atelier PA \n' +
                        'INNER JOIN pointages_atelier_lignes PAL ON PA.id = PAL.id_pointage\n' +
                        'INNER JOIN pointages_atelier_actions PAA ON PAA.id = PAL.code_action\n' +
                        'WHERE PA.id = ?',[req.body.id_pointage],
                        function (error, pointage, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
                                res.json(false)
                            } else {
                                for(var x = 0; x < pointage.length; x++){
                                    var t_duree = ((new Date("01/01/2023 "+pointage[x].heure_fin).getTime()) - (new Date("01/01/2023 "+pointage[x].heure_debut).getTime()))/1000;

                                    pointage[x].duree_journee = t_duree;
                                }

                                var t_pointages = [];
                                pointage.forEach((el) => {

                                    const p = (e) => e.id_pointage == el.id_pointage;
                                    if(t_pointages.findIndex(p) == -1){
                                        var t_pointage = {
                                            id_pointage: el.id_pointage,
                                            matricule_resource: el.matricule_resource,
                                            date: el.date,
                                            heure_debut: el.heure_debut,
                                            duree: el.duree_journee,
                                            heure_fin: el.heure_fin,
                                            lignes : []
                                        }

                                        var t_line = {
                                            id_ligne: el.id_ligne,
                                            code_chantier: el.code_chantier,
                                            code_ouvrage: el.code_ouvrage,
                                            code_action: el.code_action,
                                            duree: el.duree,
                                            commentaire: el.commentaire,
                                            toRemove: true
                                        }

                                        t_pointage.lignes.push(t_line);
                                        t_pointages.push(t_pointage);
                                    }
                                    else{

                                        var t_line = {
                                            id_ligne: el.id_ligne,
                                            code_chantier: el.code_chantier,
                                            code_ouvrage: el.code_ouvrage,
                                            code_action: el.code_action,
                                            duree: el.duree,
                                            commentaire: el.commentaire,
                                            toRemove: true
                                        }

                                        t_pointages[t_pointages.findIndex(p)].lignes.push(t_line);
                                    }

                                });

                                //Vérification des datas du pointage
                                console.log(pointage[0]);

                                //Date
                                var pointage_date = pointage[0].date.getFullYear() + '-' + (pointage[0].date.getMonth()+1) + '-' + pointage[0].date.getDate();

                                var statut = req.body.verifDuree ? 'NIVEAU1' : 'BROUILLON';

                                var pointage_update = [];
                                var pointage_update_args = [];

                                if(pointage_date != req.body.date){
                                    pointage_update.push('date = ?');

                                    pointage_update_args.push(req.body.date);
                                }

                                if(statut != pointage[0].statut){
                                    pointage_update.push('statut = ?');

                                    pointage_update_args.push(statut);
                                }

                                if(pointage[0].heure_debut != req.body.heure_debut){
                                    pointage_update.push('heure_debut = ?');

                                    pointage_update_args.push(req.body.heure_debut);
                                }

                                if(pointage[0].heure_fin != req.body.heure_fin){
                                    pointage_update.push('heure_fin = ?');

                                    pointage_update_args.push(req.body.heure_fin);
                                }

                                var toInsert = [];
                                var toInsert_args = [];

                                var toUpdate = [];
                                var toUpdate_args = [];

                                var toDelete = [];
                                var toDelete_args = [];

                                req.body.lignes.forEach((el) => {
                                    var t_update = [];
                                    var t_duree = (((new Date("01/01/2023 "+el.duree + ':00').getTime()) - (new Date("01/01/2023 00:00:00").getTime()))/1000)

                                    if(el.id_ligne != ''){
                                        const p = (e) => e.id_ligne == el.id_ligne;
                                        var idx = t_pointages[0].lignes.findIndex(p);

                                        t_pointages[0].lignes[idx].toRemove = false;

                                        if(t_pointages[0].lignes[idx].code_chantier != el.chantier){
                                            t_update.push("code_chantier = ?");
                                            toUpdate_args.push(el.chantier);
                                        }

                                        if(t_pointages[0].lignes[idx].code_ouvrage != el.ouvrage){
                                            t_update.push("code_ouvrage = ?");

                                            toUpdate_args.push(el.ouvrage == '' ? null:el.ouvrage);
                                        }

                                        if(t_pointages[0].lignes[idx].code_action != el.action){
                                            t_update.push("code_action = ?");
                                            toUpdate_args.push(el.action);
                                        }

                                        if(t_pointages[0].lignes[idx].duree != t_duree){
                                            t_update.push("duree = ?");
                                            toUpdate_args.push(t_duree);
                                        }

                                        if(t_pointages[0].lignes[idx].commentaire != el.commentaire){
                                            t_update.push("commentaire = ?");
                                            toUpdate_args.push(el.commentaire);
                                        }

                                        if(t_update.length > 0){
                                            toUpdate.push(t_update.join(',') + " WHERE id_ligne = ? ;");
                                            toUpdate_args.push(el.id_ligne);
                                        }
                                    }
                                    else {
                                        //"INSERT INTO pointages_atelier_lignes (id_pointage, code_chantier, code_ouvrage, code_action, duree, commentaire) VALUES "
                                        console.log(el);

                                        toInsert.push('(?, ?, ?, ?, ?, ?)');
                                        toInsert_args.push(req.body.id_pointage);
                                        toInsert_args.push(el.chantier);
                                        toInsert_args.push(el.ouvrage == '' ? null:el.ouvrage);
                                        toInsert_args.push(el.action);
                                        toInsert_args.push(t_duree);
                                        toInsert_args.push(el.commentaire);
                                    }
                                });

                                var toInsert_req = "INSERT INTO pointages_atelier_lignes (id_pointage, code_chantier, code_ouvrage, code_action, duree, commentaire) VALUES " + toInsert.join(',');

                                console.log(toInsert_req)

                                if(toUpdate.length > 0){
                                    var toUpdate_req = "UPDATE pointages_atelier_lignes SET " + toUpdate.join('UPDATE pointages_atelier_lignes SET ');

                                    console.log(toUpdate_req)
                                }

                                t_pointages[0].lignes.forEach((el) => {
                                    if(el.toRemove){
                                        toDelete.push('?')
                                        toDelete_args.push(el.id_ligne);
                                    }
                                });

                                if(toDelete_args.length > 0){
                                    var toDelete_req = "DELETE FROM pointages_atelier_lignes WHERE id_ligne = " + toDelete.join(' OR id_ligne = ');

                                    console.log(toDelete_req);
                                }

                                //Copie dans les tables de backup puis update
                                bdd.query('INSERT INTO pointages_atelier_origine (date, heure_debut, heure_fin) ' +
                                    'SELECT date, heure_debut, heure_fin ' +
                                    'FROM pointages_atelier WHERE id = ? AND origine_pointage IS NULL',
                                    [req.body.id_pointage],
                                    function (error, r, fields) {
                                        if (error) {
                                            log("Erreur - INSERT : " + error, 'Pointages Atelier', user.id)

                                            res.json(false)
                                        } else {

                                            if(pointage_update_args.length > 0){
                                                var requete = "UPDATE pointages_atelier SET " + pointage_update.join(',') + " WHERE id = ?";
                                                pointage_update_args.push(req.body.id_pointage);

                                                bdd.query(requete, pointage_update_args, function (error, r, fields) {
                                                    if (error) {
                                                        log("Erreur - UPD: " + error, 'Pointages Atelier', user.id)
                                                    }
                                                });
                                            }

                                            bdd.query('INSERT INTO pointages_atelier_lignes_origine ' +
                                                'SELECT id_ligne, id_pointage, code_chantier, code_ouvrage, code_action, duree, commentaire ' +
                                                'FROM pointages_atelier_lignes WHERE id_pointage = ? AND origine_ligne IS NULL',
                                                [req.body.id_pointage],
                                                function (error, insert_copy, fields) {
                                                    if (error) {
                                                        log("Erreur : " + error, 'Pointages Atelier', user.id)
                                                        res.json(false)
                                                    } else {
                                                        bdd.query('UPDATE pointages_atelier SET origine_pointage = ? WHERE id = ? AND origine_pointage IS NULL; ' +
                                                            'UPDATE pointages_atelier_lignes SET origine_ligne = id_ligne WHERE id_pointage = ? AND origine_ligne IS NULL',
                                                            [r.insertId, req.body.id_pointage, req.body.id_pointage],
                                                            function (error, pointage, fields) {
                                                                if (error) {
                                                                    log("Erreur - UPD : " + error, 'Pointages Atelier', user.id)
                                                                    res.json(false)
                                                                } else {
                                                                    if(toDelete_args.length > 0){
                                                                        bdd.query(toDelete_req, toDelete_args,
                                                                            function (error, pointage, fields) {
                                                                                if (error) {
                                                                                    log("Erreur - DEL : " + error, 'Pointages Atelier', user.id)
                                                                                    res.json(false)
                                                                                } else {
                                                                                    if(toUpdate.length > 0){
                                                                                        bdd.query(toUpdate_req, toUpdate_args,
                                                                                            function (error, pointage, fields) {
                                                                                                if (error) {
                                                                                                    log("Erreur - UPD2 : " + error, 'Pointages Atelier', user.id)
                                                                                                    res.json(false)
                                                                                                } else {
                                                                                                    if(toInsert_args.length > 0){
                                                                                                        bdd.query(toInsert_req, toInsert_args,
                                                                                                            function (error, pointage, fields) {
                                                                                                                if (error) {
                                                                                                                    log("Erreur - INS : " + error, 'Pointages Atelier', user.id)
                                                                                                                    res.json(false)
                                                                                                                } else {
                                                                                                                    res.json('OK');
                                                                                                                }
                                                                                                            });
                                                                                                    }
                                                                                                    else
                                                                                                        res.json('OK');
                                                                                                }
                                                                                            });
                                                                                    }
                                                                                    else if(toInsert_args.length > 0){
                                                                                        bdd.query(toInsert_req, toInsert_args,
                                                                                            function (error, pointage, fields) {
                                                                                                if (error) {
                                                                                                    log("Erreur - INS : " + error, 'Pointages Atelier', user.id)
                                                                                                    res.json(false)
                                                                                                } else {
                                                                                                    res.json('OK');
                                                                                                }
                                                                                            });
                                                                                    }
                                                                                    else
                                                                                        res.json('OK');

                                                                                }
                                                                            });
                                                                    }
                                                                    else if(toUpdate.length > 0){
                                                                        bdd.query(toUpdate_req, toUpdate_args,
                                                                            function (error, pointage, fields) {
                                                                                if (error) {
                                                                                    log("Erreur - UPD2 : " + error, 'Pointages Atelier', user.id)
                                                                                    res.json(false)
                                                                                } else {
                                                                                    if(toInsert_args.length > 0){
                                                                                        bdd.query(toInsert_req, toInsert_args,
                                                                                            function (error, pointage, fields) {
                                                                                                if (error) {
                                                                                                    log("Erreur - INS : " + error, 'Pointages Atelier', user.id)
                                                                                                    res.json(false)
                                                                                                } else {
                                                                                                    res.json('OK');
                                                                                                }
                                                                                            });
                                                                                    }
                                                                                    else
                                                                                        res.json('OK');
                                                                                }
                                                                            });
                                                                    }
                                                                    else if(toInsert_args.length > 0){
                                                                        bdd.query(toInsert_req, toInsert_args,
                                                                            function (error, pointage, fields) {
                                                                                if (error) {
                                                                                    log("Erreur - INS : " + error, 'Pointages Atelier', user.id)
                                                                                    res.json(false)
                                                                                } else {
                                                                                    res.json('OK');
                                                                                }
                                                                            });
                                                                    }
                                                                    else
                                                                        res.json('OK');
                                                                }
                                                            });
                                                    }
                                                });
                                        }
                                    });

                                //Sinon, si origine, traiter uniquement les lignes sans origine

                            }
                        });
                }
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


};
