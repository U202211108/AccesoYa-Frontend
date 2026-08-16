import {
    Component,
    inject
} from '@angular/core';

import {
    FormsModule
} from '@angular/forms';

import {
    Router
} from '@angular/router';

import {
    AuthService
} from '../../../core/services/auth.service';


@Component({
    selector: 'app-register',

    standalone: true,

    imports: [
        FormsModule
    ],

    templateUrl:
        './register.component.html',

    styleUrl:
        './register.component.scss'
})
export class RegisterComponent {

    private readonly authService =
        inject(AuthService);

    private readonly router =
        inject(Router);


    // =====================================================
    // FORM DATA
    // =====================================================

    firstName = '';

    lastName = '';

    email = '';

    password = '';

    confirmPassword = '';


    // =====================================================
    // UI STATE
    // =====================================================

    errorMessage = '';

    successMessage = '';

    isLoading = false;

    showPassword = false;

    showConfirmPassword = false;


    // =====================================================
    // REGISTER
    // =====================================================

    onSubmit(): void {

        this.errorMessage = '';

        this.successMessage = '';


        // -----------------------------------------------
        // NOMBRES
        // -----------------------------------------------

        if (!this.firstName.trim()) {

            this.errorMessage =
                'Ingresa tus nombres.';

            return;
        }


        if (
            this.firstName.trim().length < 2
        ) {

            this.errorMessage =
                'Los nombres deben tener al menos 2 caracteres.';

            return;
        }


        // -----------------------------------------------
        // APELLIDOS
        // -----------------------------------------------

        if (!this.lastName.trim()) {

            this.errorMessage =
                'Ingresa tus apellidos.';

            return;
        }


        if (
            this.lastName.trim().length < 2
        ) {

            this.errorMessage =
                'Los apellidos deben tener al menos 2 caracteres.';

            return;
        }


        // -----------------------------------------------
        // EMAIL
        // -----------------------------------------------

        if (!this.email.trim()) {

            this.errorMessage =
                'Ingresa tu correo electrónico.';

            return;
        }


        if (!this.isValidEmail(this.email)) {

            this.errorMessage =
                'Ingresa un correo electrónico válido.';

            return;
        }


        // -----------------------------------------------
        // PASSWORD
        // -----------------------------------------------

        if (!this.password) {

            this.errorMessage =
                'Ingresa una contraseña.';

            return;
        }


        if (this.password.length < 8) {

            this.errorMessage =
                'La contraseña debe tener al menos 8 caracteres.';

            return;
        }


        // -----------------------------------------------
        // CONFIRM PASSWORD
        // -----------------------------------------------

        if (!this.confirmPassword) {

            this.errorMessage =
                'Confirma tu contraseña.';

            return;
        }


        if (
            this.password !==
            this.confirmPassword
        ) {

            this.errorMessage =
                'Las contraseñas no coinciden.';

            return;
        }


        // -----------------------------------------------
        // REQUEST
        // -----------------------------------------------

        this.isLoading = true;


        this.authService
            .register({

                firstName:
                    this.firstName.trim(),

                lastName:
                    this.lastName.trim(),

                email:
                    this.email.trim().toLowerCase(),

                password:
                    this.password

            })
            .subscribe({

                next: () => {

                    this.isLoading = false;

                    this.successMessage =
                        'Cuenta creada correctamente.';


                    setTimeout(() => {

                        this.router.navigate([
                            '/login'
                        ]);

                    }, 1200);
                },


                error: error => {

                    console.error(
                        'Error de registro:',
                        error
                    );

                    this.isLoading = false;


                    if (
                        error.status === 400
                    ) {

                        this.errorMessage =
                            error.error?.message ??
                            'Los datos ingresados no son válidos.';

                    } else if (
                        error.status === 409
                    ) {

                        this.errorMessage =
                            'El correo electrónico ya está registrado.';

                    } else {

                        this.errorMessage =
                            'No se pudo crear la cuenta. Inténtalo nuevamente.';
                    }
                }

            });
    }


    // =====================================================
    // PASSWORD VISIBILITY
    // =====================================================

    togglePasswordVisibility(): void {

        this.showPassword =
            !this.showPassword;
    }


    toggleConfirmPasswordVisibility(): void {

        this.showConfirmPassword =
            !this.showConfirmPassword;
    }


    // =====================================================
    // EMAIL VALIDATION
    // =====================================================

    private isValidEmail(
        email: string
    ): boolean {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailPattern.test(
            email.trim()
        );
    }


    // =====================================================
    // CLEAR ERROR
    // =====================================================

    clearError(): void {

        if (this.errorMessage) {

            this.errorMessage = '';
        }
    }


    // =====================================================
    // LOGIN
    // =====================================================

    goToLogin(): void {

        this.router.navigate([
            '/login'
        ]);
    }
}