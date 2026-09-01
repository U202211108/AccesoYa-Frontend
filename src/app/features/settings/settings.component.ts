import {
    Component,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';


interface AppSettings {

    notificationsEnabled: boolean;

    emailNotifications: boolean;

}


@Component({

    selector: 'app-settings',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './settings.component.html',

    styleUrl:
        './settings.component.scss'

})
export class SettingsComponent
    implements OnInit {


    // =====================================================
    // CONFIGURACIÓN
    // =====================================================

    notificationsEnabled = true;

    emailNotifications = true;


    // =====================================================
    // MENSAJE
    // =====================================================

    showSavedMessage = false;

    private savedMessageTimeout:
        ReturnType<typeof setTimeout> | null = null;


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.loadSettings();

    }


    // =====================================================
    // CARGAR CONFIGURACIÓN
    // =====================================================

    private loadSettings(): void {

        const storedSettings =
            localStorage.getItem(
                'app_settings'
            );


        if (!storedSettings) {

            return;

        }


        try {

            const settings:
                Partial<AppSettings> =
                JSON.parse(
                    storedSettings
                );


            this.notificationsEnabled =
                settings.notificationsEnabled
                ?? true;


            this.emailNotifications =
                settings.emailNotifications
                ?? true;


        } catch (error) {

            console.error(
                'Error leyendo configuración:',
                error
            );

        }

    }


    // =====================================================
    // GUARDAR CONFIGURACIÓN
    // =====================================================

    private saveSettings(): void {

        const settings:
            AppSettings = {

            notificationsEnabled:
                this.notificationsEnabled,

            emailNotifications:
                this.emailNotifications

        };


        localStorage.setItem(

            'app_settings',

            JSON.stringify(
                settings
            )

        );


        this.showSavedConfirmation();

    }


    // =====================================================
    // NOTIFICACIONES DE LA APLICACIÓN
    // =====================================================

    toggleNotifications(): void {

        this.notificationsEnabled =
            !this.notificationsEnabled;


        this.saveSettings();

    }


    // =====================================================
    // NOTIFICACIONES POR CORREO
    // =====================================================

    toggleEmailNotifications(): void {

        this.emailNotifications =
            !this.emailNotifications;


        this.saveSettings();

    }


    // =====================================================
    // CONFIRMACIÓN
    // =====================================================

    private showSavedConfirmation(): void {

        this.showSavedMessage = true;


        if (
            this.savedMessageTimeout
        ) {

            clearTimeout(
                this.savedMessageTimeout
            );

        }


        this.savedMessageTimeout =
            setTimeout(() => {

                this.showSavedMessage =
                    false;

                this.savedMessageTimeout =
                    null;

            }, 2200);

    }

}