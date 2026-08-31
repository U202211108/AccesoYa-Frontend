import {
    inject
} from '@angular/core';

import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router
} from '@angular/router';

import {
    AuthService
} from '../services/auth.service';

import {
    UserRole
} from '../models/auth-user';


export const roleGuard: CanActivateFn = (

    route: ActivatedRouteSnapshot

) => {

    const authService =
        inject(AuthService);

    const router =
        inject(Router);


    if (!authService.isAuthenticated()) {

        return router.createUrlTree([
            '/login'
        ]);
    }


    const allowedRoles =
        route.data['roles'] as
        UserRole[] | undefined;


    if (
        !allowedRoles ||
        allowedRoles.length === 0
    ) {

        return true;
    }


    const currentRole =
        authService.getCurrentRole();


    if (!currentRole) {

        return router.createUrlTree([
            '/dashboard'
        ]);
    }


    if (
        allowedRoles.includes(
            currentRole
        )
    ) {

        return true;
    }


    return router.createUrlTree([
        '/dashboard'
    ]);
};