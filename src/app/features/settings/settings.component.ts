import {
    Component,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';


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


    notificationsEnabled = true;

    emailNotifications = true;

    mapAccessibility = true;


    ngOnInit(): void {

        const settings =
            localStorage.getItem(
                'app_settings'
            );

        if (!settings) {
            return;
        }

        try {

            const data =
                JSON.parse(settings);

            this.notificationsEnabled =
                data.notificationsEnabled ??
                true;

            this.emailNotifications =
                data.emailNotifications ??
                true;

            this.mapAccessibility =
                data.mapAccessibility ??
                true;

        } catch (error) {

            console.error(
                'Error leyendo configuración:',
                error
            );
        }
    }


    saveSettings(): void {

        localStorage.setItem(
            'app_settings',
            JSON.stringify({
                notificationsEnabled:
                    this.notificationsEnabled,

                emailNotifications:
                    this.emailNotifications,

                mapAccessibility:
                    this.mapAccessibility
            })
        );
    }


    toggleNotifications(): void {

        this.notificationsEnabled =
            !this.notificationsEnabled;

        this.saveSettings();
    }


    toggleEmailNotifications(): void {

        this.emailNotifications =
            !this.emailNotifications;

        this.saveSettings();
    }


    toggleMapAccessibility(): void {

        this.mapAccessibility =
            !this.mapAccessibility;

        this.saveSettings();
    }
}