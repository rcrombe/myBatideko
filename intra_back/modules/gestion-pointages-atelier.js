module.exports = function (SECURITY, notify, app, bdd, jsonWebToken, webTokenKey, bcrypt, request,log,printLogLevel,semaine, querystring, NAV_KEY) {
    const loglevel = printLogLevel();

    const timeStringToFloat = (time) => {
        var hoursMinutes = time.split(/[.:]/);
        var hours = parseInt(hoursMinutes[0], 10);
        var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
        return hours + minutes / 60 + (parseInt(hoursMinutes[2]) / 3600);
    };

    const formatDate = (el) => {
        var date_start = new Date(el);
        var year = date_start.getFullYear();
        var month = (date_start.getMonth() + 1) >= 10 ? (date_start.getMonth() + 1) : ("0" + (date_start.getMonth() + 1));
        var day = date_start.getDay() >= 10 ? date_start.getDay() : ("0" + date_start.getDay());

        return year + "-" + month + "-" + day;
    };

    const canCheckHours = (el) => {
        if (el.length == 0)
            return true;
        else {
            var exists = false;
            el.forEach((absence) => {
                if (absence.code_absence == 'ABSRECUP') {
                    exists = true;
                }
            });
            return exists;
        }
    }

    const isChantier = (el) => {
        return (el != 'HATF' && el != 'HATP');
    }

    const chantiersCount = (fiche, day_name, matricule_resource) => {
        var count = 0;

        for (var i = 0; i < fiche.lignes.length; i++) {
            if (fiche.lignes[i].jour == day_name
                && fiche.lignes[i].matricule_resource == matricule_resource
                && fiche.lignes[i].code_chantier != '_ABSENCE_'
            ) {
                count++;
            }
        }

        return count;
    }

    const canApplyPause = (chantier) => {
        return chantier.includes("CC") || chantier.includes("CA");
    }

    const getNumberOfEligiblePause = (chantiers) => {
        var number = 0;

        for (let el of chantiers) {
            if (canApplyPause(el.code_chantier))
                number++;
        }

        return number;
    }

    const alreadyHasHT = (matricule, date, fiche) => {
        for (let el of fiche.lignes) {
            if (el.matricule_resource == matricule && el.date == date && (el.code_type_travail == 'HT' || el.code_type_travail == 'HTT'))
                return true;
        }
        return false;
    }

    const hasPASSLine = (matricule, date, fiche) => {
        for (let el of fiche.lignes) {
            if (el.matricule_resource == matricule && el.date == date && (el.code_type_travail == 'PASS'))
                return true;
        }
        return false;
    }

    const resetHTOnLine = (matricule, date, fiche) => {
        for (let el of fiche.lignes) {
            if (el.matricule_resource == matricule && el.date == date && (el.code_type_travail == 'HT' || el.code_type_travail == 'HTT'))
                el.code_type_travail = 'H';
        }
    }

    const getHTLine = (matricule, date, fiche) => {
        for (var idx = 0; idx < fiche.lignes.length; idx++) {
            if (fiche.lignes[idx].matricule_resource == matricule && fiche.lignes[idx].date == date && (fiche.lignes[idx].code_type_travail == 'HT' || fiche.lignes[idx].code_type_travail == 'HTT'))
                return idx;
        }
    }

    const canPutExtra = (chantier) => {
        if (chantier.split('_').length <= 1 || chantier == '_ATELIER')
            return true;
        return false;
    }

    const days_name = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    app.get('/api/sync-pointages-atelier', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER_SYNC', token)) {
                    bdd.query('SELECT DISTINCT S.* FROM semaines S, pointages_atelier PA WHERE PA.date BETWEEN S.date_start AND S.date_end AND PA.statut = \'VALIDE\'',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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

    app.get('/api/sync-pointages-atelier/resources', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER_SYNC', token)) {
                    bdd.query('select matricule_resource, Nom from resources where Actif = 1 and Activite = \'3.50-ATELIER\' ' +
                        'ORDER BY Nom ASC',
                        function (error, results, fields) {
                            if (error) {
                                log("Erreur : " + error, 'Pointages Atelier', user.id)
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


    app.get('/api/sync-pointages-atelier/absences/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                var date = req.params.date;

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER_SYNC', token)) {
                    bdd.query('SELECT AA.*, A.type ' +
                        'FROM assignations_absence AA, absences A ' +
                        'WHERE AA.id_semaine = ? AND A.code_absence = AA.code_absence ', [req.params.idSemaine],
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

    app.get('/api/sync-pointages-atelier/vehicules/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                var date = req.params.date;

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER_SYNC', token)) {
                    bdd.query('SELECT AV.* ' +
                        'FROM assignations_vehicules AV ' +
                        'WHERE AV.id_semaine = ? ', [req.params.idSemaine],
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


    app.get('/api/sync-pointages-atelier/:idSemaine', function (req, res) {
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                var date = req.params.idSemaine;

                console.log("idSemaine : " + req.params.idSemaine)

                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);

                if(SECURITY.canAccessRessource(user, 'r', 'M_POINTAGES_ATELIER_SYNC', token)) {
                    bdd.query('SELECT PAL.*, PAA.nav_action, PA.date, R.matricule_resource, R.Nom ' +
                        'FROM pointages_atelier PA, pointages_atelier_lignes PAL, pointages_atelier_actions PAA, resources R, semaines S ' +
                        'WHERE PA.matricule_resource = R.matricule_resource AND statut = "VALIDE" ' +
                        'AND PA.date BETWEEN S.date_start AND S.date_end ' +
                        'AND PAL.id_pointage = PA.id ' +
                        'AND PAA.id = PAL.code_action ' +
                        'AND S.id = ? ' +
                        'ORDER BY R.Nom, PAL.code_chantier, PA.date', [req.params.idSemaine],
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
                                                if (el.code_chantier != null) {
                                                    for (let chantier of chantiers) {
                                                        if (chantier.code_chantier == el.code_chantier) {
                                                            el.code_chantier = chantier.code_chantier;
                                                            el.nom_chantier = chantier.nom_chantier;
                                                            el.zone_chantier = chantier.zone;
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
                else
                    res.json('SECURITY_ERROR');
            }
        });
    });


    app.post('/api/sync-pointages-atelier/syncWeekNav', function (req, res) {
        console.log('SyncWeek Nav :)')
        jsonWebToken.verify(req.headers.authorization.split(' ')[1], webTokenKey, function (err, decode) {
            if (err) {
                log("Erreur : " + err, 'Pointages', null);
                res.send(false);
            } else {
                const token = req.headers.authorization.split(' ')[1];
                const user = jsonWebToken.decode(token);


//https://calendrier.api.gouv.fr/jours-feries/metropole/2021.json
                if(SECURITY.canAccessRessource(user, 'w', 'M_POINTAGES_SYNC', token)){
                    /*
                    BDD jours fériés
                     */
                    var year = (new Date(req.body.date_start)).getFullYear() != (new Date(req.body.date_end)).getFullYear() ? (new Date(req.body.date_end)).getFullYear():(new Date(req.body.date_start)).getFullYear();

                    var feries = [];

                    request.get('https://calendrier.api.gouv.fr/jours-feries/metropole/'+year+'.json', function (error, result, body) {
                        if (error) {
                            log("Erreur : " + error, 'PointagesNav', user.id)
                        } else {
                            var j = JSON.parse(result.body);

                            feries = Object.keys(j);
                        }
                    });

                    /* Worker */

                    const fiche = {
                        nb_semaine: req.body.nb_semaine,
                        date_start: req.body.date_start,
                        date_end: req.body.date_end,
                        lignes: []
                    }

                    req.body.list.forEach((resource) => {
                        var idx = 0;
                        var matricule_resource = resource.matricule_resource;

                        resource.days.forEach((el) => {

                            var date = new Date(req.body.date_start);
                            date.setDate(date.getDate() + idx);
                            var dateString = date.getFullYear() + '-' +
                                ("0" + (date.getMonth() + 1)).slice(-2) + '-' +
                                ("0" + date.getDate()).slice(-2);

                            if(el.chantiers.length == 0 && el.absences.length == 0){
                                //console.log("Jour n°" + idx + " est vide");
                            }
                            else {
                                var duree_chauffeur = timeStringToFloat(el.trajets_chauffeur);
                                var duree_passager = timeStringToFloat(el.trajets_passager);

                                var journee_duree = 0.0;
                                var has_chantier = false;

                                if(el.absences.length > 0 && idx < 5){
                                    el.absences.forEach((absence) => {
                                        if(absence.type == 'ERP'){
                                            if(absence.code_absence == 'CFA'){
                                                var line = {};
                                                line.code_chantier = 'FORMATION APPRENTI';
                                                line.zone = null;
                                                line.date = dateString;
                                                line.matricule_resource = matricule_resource;

                                                if(absence.duree == 'AM')
                                                    line.duree = 3.5;
                                                else if(absence.duree == 'PM')
                                                    line.duree = 3.5;
                                                else
                                                    line.duree = 7;

                                                line.code_type_travail = 'HCFA';
                                                line.jour = days_name[idx];
                                                line.date_offset = idx;
                                                line.force_panier = 0;

                                                //console.log(matricule_resource + "_INIT1 : " + journee_duree);
                                                journee_duree += line.duree;
                                                fiche.lignes.push(line);

                                            }
                                            else if(absence.code_absence == 'FORM'){
                                                var line = {};
                                                line.code_chantier = '_FORMATION';
                                                line.zone = null;
                                                line.date = dateString;
                                                line.matricule_resource = matricule_resource;

                                                if(absence.duree == 'AM'){
                                                    line.duree = 3.5;
                                                    line.force_panier = 0;
                                                }
                                                else if(absence.duree == 'PM'){
                                                    line.duree = 3.5;
                                                    line.force_panier = 0;
                                                }
                                                else {
                                                    line.duree = 7;
                                                    line.force_panier = 1;
                                                }

                                                line.code_type_travail = 'HT';
                                                line.jour = days_name[idx];
                                                line.date_offset = idx;

                                                //console.log(matricule_resource + "_INIT2 : " + journee_duree);
                                                journee_duree += line.duree;
                                                fiche.lignes.push(line);

                                            }
                                            else if(absence.code_absence == 'FERIE'){
                                                var line = {};
                                                line.code_chantier = '_ABSENCE';
                                                line.zone = null;
                                                line.date = dateString;
                                                line.matricule_resource = matricule_resource;

                                                if(idx != 4){
                                                    if (absence.duree == 'AM')
                                                        line.duree = 3.875;
                                                    else if (absence.duree == 'PM')
                                                        line.duree = 3.875;
                                                    else
                                                        line.duree = 7.75;
                                                }
                                                else {
                                                    line.duree = 4;
                                                }

                                                line.code_type_travail = 'HFERIE';
                                                line.jour = days_name[idx];
                                                line.date_offset = idx;
                                                line.force_panier = 0;

                                                //console.log(matricule_resource + "_INIT3 : " + journee_duree);
                                                journee_duree += line.duree;
                                                fiche.lignes.push(line);
                                            }
                                            else {
                                                if(!(absence.code_absence == 'ABSRECUP'
                                                    && (absence.duree == 'AM' ||absence.duree == 'PM'))) {
                                                    var line = {};
                                                    line.code_chantier = '_ABSENCE_';
                                                    line.zone = null;
                                                    line.date = dateString;
                                                    line.matricule_resource = matricule_resource;

                                                    if(absence.code_absence == 'ABSCP'){
                                                        if (absence.duree == 'AM')
                                                            line.duree = 3.5;
                                                        else if (absence.duree == 'PM')
                                                            line.duree = 3.5;
                                                        else
                                                            line.duree = 7;
                                                    }
                                                    else {
                                                        if(idx != 4){
                                                            if (absence.duree == 'AM')
                                                                line.duree = 3.875;
                                                            else if (absence.duree == 'PM')
                                                                line.duree = 3.875;
                                                            else
                                                                line.duree = 7.75;
                                                        }
                                                        else {
                                                            line.duree = 4;
                                                        }
                                                    }

                                                    line.code_type_travail = (absence.code_absence == 'ABSRECUP' ? 'ABSMOD' : absence.code_absence);
                                                    line.jour = days_name[idx];
                                                    line.date_offset = idx;
                                                    line.force_panier = 0;

                                                    //console.log(matricule_resource + "_INIT4 : " + journee_duree);
                                                    journee_duree += line.duree;
                                                    fiche.lignes.push(line);
                                                }
                                            }
                                        }
                                    });
                                }

                                var hasMoreThan50 = false;
                                var chantierMoreThan50 = null;

                                if(el.chantiers.length > 0){
                                    var remainder = 0.0;
                                    var time_chantier = 0.0;
                                    var max_chantier = 0.0;

                                    el.chantiers.forEach((chantier) => {
                                        if (chantier.code_chantier != 'CC000000') {

                                            if (!hasMoreThan50 && chantierMoreThan50 == null && canPutExtra(chantier.code_chantier))
                                                chantierMoreThan50 = chantier.code_chantier;

                                            var line = {};
                                            line.code_chantier = chantier.code_chantier;
                                            line.zone = chantier.zone_chantier;
                                            line.date = dateString;
                                            line.matricule_resource = matricule_resource;
                                            line.duree = 0;

                                            var d = timeStringToFloat(chantier.duree);

                                            var d_tmp = timeStringToFloat(chantier.duree);

                                            //console.log("NUIT : " + timeStringToFloat(chantier.duree_nuit))

                                            line.duree = d - timeStringToFloat(chantier.duree_nuit);
                                            d_tmp = d - timeStringToFloat(chantier.duree_nuit);

                                            //console.log(chantier.code_chantier);
                                            //console.log(d);
                                            //console.log(line.duree);

                                            //console.log(matricule_resource + "_INIT7 : " + journee_duree);
                                            if(chantier.nav_action != 'CHAUF')
                                                journee_duree += d - timeStringToFloat(chantier.duree_nuit);



                                            time_chantier += d - timeStringToFloat(chantier.duree_nuit);

                                            if (d_tmp > max_chantier)
                                                max_chantier = d_tmp;

                                            //if(duree_chauffeur > 0) ^par défaut = H
                                            if(isChantier(chantier.nav_action) && chantier.code_chantier != '_REUNION' && chantier.code_chantier != '_CHARGEMENT' && chantier.code_chantier != '_MEDECINE') {
                                                has_chantier = true;
                                            }

                                            line.code_type_travail = chantier.nav_action;

                                            if (el.immatriculation == "_PERSONNEL") {
                                                // On lui demande son véhicule perso
                                                if(canPutExtra(line.code_chantier)){
                                                    if(alreadyHasHT(line.matricule_resource, line.date, fiche)) {
                                                        var idx_HT = getHTLine(line.matricule_resource, line.date, fiche);
                                                        if (line.zone > fiche.lignes[idx_HT].zone && line.zone != 'PROV') {

                                                            line.code_type_travail = fiche.lignes[idx_HT].code_type_travail;
                                                            fiche.lignes[idx_HT].code_type_travail = 'H';
                                                        }
                                                    }
                                                    else
                                                        line.code_type_travail = 'HTT';
                                                }

                                            }

                                            if ((chantier.zone_chantier < 'Z6' || chantier.zone_chantier == '') && line.zone != 'PROV' && isChantier(chantier.nav_action)) { //Z5,Z4,Z3,Z2,Z1
                                                if (el.immatriculation == "_CONVENANCE" || duree_passager > 0)//Convenance ou passager
                                                    if(canPutExtra(line.code_chantier)){
                                                        if(alreadyHasHT(line.matricule_resource, line.date, fiche)) {
                                                            var idx_HT = getHTLine(line.matricule_resource, line.date, fiche);
                                                            if (line.zone > fiche.lignes[idx_HT].zone && line.zone != 'PROV') {
                                                                line.code_type_travail = fiche.lignes[idx_HT].code_type_travail;
                                                                fiche.lignes[idx_HT].code_type_travail = 'H';
                                                            }
                                                        }
                                                        else if(hasPASSLine(line.matricule_resource, line.date, fiche)){
                                                            line.code_type_travail = 'H';
                                                        }
                                                        else{
                                                            line.code_type_travail = 'HT';
                                                        }
                                                    }
                                            } else {
                                                if(canPutExtra(line.code_chantier) && isChantier(chantier.nav_action)){
                                                    hasMoreThan50 = true;
                                                    chantierMoreThan50 = chantier.code_chantier;
                                                }
                                            }


                                            if (feries.includes(dateString))
                                                line.code_type_travail = 'HFERIE';

                                            line.jour = days_name[idx];
                                            line.date_offset = idx;
                                            line.force_panier = 0;

                                            if (timeStringToFloat(chantier.duree_nuit) > 0) {
                                                var line_nuit = {};
                                                line_nuit.code_chantier = chantier.code_chantier;
                                                line_nuit.zone = chantier.zone_chantier == '' ? null:chantier.zone_chantier;
                                                line_nuit.date = dateString;
                                                line_nuit.matricule_resource = matricule_resource;
                                                line_nuit.duree = timeStringToFloat(chantier.duree_nuit);
                                                line_nuit.code_type_travail = 'HNUIT';
                                                line_nuit.jour = days_name[idx];
                                                line_nuit.date_offset = idx;
                                                line_nuit.force_panier = 0;

                                                journee_duree += timeStringToFloat(chantier.duree_nuit);

                                                fiche.lignes.push(line_nuit);
                                            }
                                            if(line.duree > 0) {
                                                /*if(line.matricule_resource == '000250')
                                                    console.log(line);*/
                                                fiche.lignes.push(line);
                                            }
                                        }
                                    });

                                    if(
                                        has_chantier
                                        &&
                                        (
                                            (max_chantier < 6 && time_chantier >= 6)
                                            || (max_chantier >= 6 && time_chantier < 7)
                                        )
                                    ){ // Forcer le panier si que des chantiers <6h
                                        var maxDureeIdx = -1;
                                        for(var x = 1; x < fiche.lignes.length; x++){
                                            if(fiche.lignes[x].matricule_resource == matricule_resource && fiche.lignes[x].jour == days_name[idx]) {

                                                if (
                                                    isChantier(fiche.lignes[x].code_type_travail)
                                                    && (maxDureeIdx == -1 || fiche.lignes[x].duree > fiche.lignes[maxDureeIdx])
                                                ) {
                                                    if (fiche.lignes[x].code_type_travail != 'CHAUF' && fiche.lignes[x].code_type_travail != 'PASS' && canPutExtra(fiche.lignes[x].code_chantier))
                                                        maxDureeIdx = x;
                                                    else {

                                                        console.log("CANNOT3 : ")
                                                        console.log(fiche.lignes[x])
                                                    }
                                                }
                                                else {

                                                    console.log("CANNOT2 : ")
                                                    console.log(fiche.lignes[x])
                                                }
                                            }
                                        }

                                        console.log(fiche)

                                        fiche.lignes[maxDureeIdx].force_panier = 1;

                                        console.log('===================================================')
                                    }

                                    if(remainder > 0){


                                        if(chantiersCount(fiche, days_name[idx], matricule_resource) > 1){

                                            console.log('CHANTIER COUNT OK');

                                            for(var i = 0; i < fiche.lignes.length; i++){
                                                if(fiche.lignes[i].duree > remainder){
                                                    if(fiche.lignes[i].jour == days_name[idx]
                                                        && fiche.lignes[i].matricule_resource == matricule_resource && fiche.lignes[i].code_type_travail != 'CHAUF'){

                                                        console.log(matricule_resource + ' _ Remainder : ' + remainder)

                                                        fiche.lignes[i].duree -= remainder;
                                                        journee_duree -= remainder;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            console.log('CHANTIER COUNT NOK : ', chantiersCount(fiche, days_name[idx], matricule_resource));

                                            for(var i = 0; i < fiche.lignes.length; i++){
                                                if(fiche.lignes[i].duree > remainder){
                                                    if(fiche.lignes[i].jour == days_name[idx]
                                                        && fiche.lignes[i].matricule_resource == matricule_resource
                                                        && fiche.lignes[i].code_chantier != '_ABSENCE_' && fiche.lignes[i].code_type_travail != 'CHAUF'){

                                                        console.log(matricule_resource + ' _ Remainder : ' + remainder)

                                                        fiche.lignes[i].duree -= remainder;
                                                        journee_duree -= remainder;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else if(el.absences.length == 0){
                                    //Aucune data, que faire ?
                                }


                                //if(canCheckHours(el.absences)){
                                if(journee_duree > 0){
                                    if(journee_duree != 7){
                                        //ABSRECUP
                                        var line = {};
                                        line.code_chantier = '_ABSENCE_';
                                        line.zone = null;
                                        line.date = dateString;
                                        line.matricule_resource = matricule_resource;

                                        if(idx > 4)
                                            line.duree = 0-journee_duree;
                                        else
                                            line.duree = 7-journee_duree;

                                        line.code_type_travail = "ABSMOD";
                                        line.jour = days_name[idx];
                                        line.date_offset = idx;
                                        line.force_panier = 0;

                                        fiche.lignes.push(line);
                                    }
                                }

                                if(duree_chauffeur > 0){
                                    var line = {};
                                    line.code_chantier = chantierMoreThan50;
                                    line.zone = null;
                                    line.date = dateString;
                                    line.matricule_resource = matricule_resource;

                                    line.duree = duree_chauffeur;

                                    line.code_type_travail = "CHAUF";
                                    line.jour = days_name[idx];
                                    line.date_offset = idx;
                                    line.force_panier = 0;

                                    fiche.lignes.push(line);
                                }

                                if(duree_passager > 0 && hasMoreThan50){
                                    var line = {};
                                    line.code_chantier = chantierMoreThan50;
                                    line.zone = null;
                                    line.date = dateString;
                                    line.matricule_resource = matricule_resource;

                                    line.duree = duree_passager;

                                    line.code_type_travail = "PASS";
                                    line.jour = days_name[idx];
                                    line.date_offset = idx;
                                    line.force_panier = 0;

                                    resetHTOnLine(line.matricule_resource, line.date, fiche);
                                    fiche.lignes.push(line);
                                }
                            }

                            /*console.log(idx + ' _ FINAL : ' + journee_duree)
                            console.log('--')*/
                            idx++;
                        });
                    });

                    fiche.__nav = NAV_KEY();

                    var body = JSON.stringify(fiche);

                    var options = {
                        url: 'https://api.cuppens.fr/api/pointages/creerFicheSemaine',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: body,
                    }


                    request.post(options, function (error, resultPost, body) {
                        if (error) {
                            log("Erreur : " + error, 'PointagesNav', user.id)
                            res.json(false)
                        } else {
                            res.json(true);
                        }
                    });
                }
                else
                    res.json(false);

            }
        })
    });


}