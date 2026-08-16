import {
    Component,
    OnInit
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    RouterLink
} from '@angular/router';

@Component({
    selector: 'app-dashboard',

    standalone: true,

    imports: [
        CommonModule,
        RouterLink
    ],

    templateUrl:
        './dashboard.component.html',

    styleUrl:
        './dashboard.component.scss'
})
export class DashboardComponent
    implements OnInit {

    firstName = 'Usuario';

    role = 'USER';


    ngOnInit(): void {

        const userData =
            localStorage.getItem('user');

        if (!userData) {
            return;
        }

        try {

            const user =
                JSON.parse(userData);

            this.firstName =
                user.firstName ??
                'Usuario';

            this.role =
                user.role ??
                'USER';

        } catch (error) {

            console.error(
                'Error leyendo usuario:',
                error
            );
        }
    }
}