import { Injectable } from "@angular/core";

@Injectable()
export class Constants {
    public readonly apiUrl: string = 'http://dev-api-my.batideko.fr/api/';
    public readonly toastrTitle: string = 'MyBatideko';
    public readonly version: string = "WIP - 0.0";
    public readonly isDev: boolean = false;

    public canAccess_Read(utilisateur: { permissions: any[]; }, module_id: null){
        var idx = utilisateur.permissions.findIndex((e: { module_id: any; }) => e.module_id == module_id);

        if(idx == -1 || utilisateur.permissions[idx].r != 1)
            return false;
        return true;
    }

    public canAccess_Write(utilisateur: { permissions: any[]; }, module_id: null){
        var idx = utilisateur.permissions.findIndex((e: { module_id: any; }) => e.module_id == module_id);

        if(idx == -1 || utilisateur.permissions[idx].w != 1)
            return false;
        return true;
    }

    public canAccess_Special(utilisateur: { permissions: any[]; }, module_id: null){
        var idx = utilisateur.permissions.findIndex((e: { module_id: any; }) => e.module_id == module_id);

        if(idx == -1 || utilisateur.permissions[idx].special != 1)
            return false;
        return true;
    }
}
