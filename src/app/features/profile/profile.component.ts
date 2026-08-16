import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    AuthService
} from '../../core/services/auth.service';


@Component({
    selector: 'app-profile',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './profile.component.html',

    styleUrl:
        './profile.component.scss'
})
export class ProfileComponent
    implements OnInit {


    private readonly authService =
        inject(AuthService);


    firstName = '';

    lastName = '';

    email = '';

    role = '';


    ngOnInit(): void {

        const user =
            this.authService.getCurrentUser();

        if (!user) {
            return;
        }

        this.firstName =
            user.firstName;

        this.lastName =
            user.lastName;

        this.email =
            user.email;

        this.role =
            user.role;
    }


    getRoleLabel(): string {

        return this.authService
            .getRoleLabel();
    }
}