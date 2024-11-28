import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable()
export class Constants {
    constructor(private snackBar: MatSnackBar) { }

    public readonly apiUrl: string = 'http://dev-api-my.batideko.fr/api/';
    public readonly toastrTitle: string = 'MyBatideko';
    public readonly version: string = "WIP - 0.0";
    public readonly isDev: boolean = false;

    public canAccess_Read(utilisateur: { permissions: any[] }, module_id: string | null): boolean {

        var idx = utilisateur.permissions.findIndex((e: { module_id: any }) => e.module_id === module_id);
        if (idx == -1 || utilisateur.permissions[idx].r != 1) {
            return false;
        }
        return true;
    }

    public canAccess_Write(utilisateur: { permissions: any[]; }, module_id: null) {
        var idx = utilisateur.permissions.findIndex((e: { module_id: any; }) => e.module_id == module_id);

        if (idx == -1 || utilisateur.permissions[idx].w != 1)
            return false;
        return true;
    }

    public canAccess_Special(utilisateur: { permissions: any[]; }, module_id: null) {
        var idx = utilisateur.permissions.findIndex((e: { module_id: any; }) => e.module_id == module_id);

        if (idx == -1 || utilisateur.permissions[idx].special != 1)
            return false;
        return true;
    }

    private getSnackBarConfig(isSuccess: boolean): MatSnackBarConfig {
        return {
            duration: 100000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: isSuccess ? ['mat-mdc-simple-snack-bar', 'custom-success-snackbar'] : ['mat-mdc-simple-snack-bar', 'custom-error-snackbar'],
        };
    }

    showSuccess(message: string, action: string = 'Fermer') {
        this.snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
        });
    }

    showError(message: string, action: string = 'Fermer') {
        this.snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
        });
    }
}
