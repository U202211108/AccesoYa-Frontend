import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        FormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {

    private readonly authService =
        inject(AuthService);

    private readonly router =
        inject(Router);


    email = '';

    password = '';

    errorMessage = '';

    isLoading = false;

    showPassword = false;


    // =====================================================
    // LOGIN
    // =====================================================

    onSubmit(): void {

        this.errorMessage = '';


        // Validación básica adicional

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


        if (!this.password) {

            this.errorMessage =
                'Ingresa tu contraseña.';

            return;
        }


        this.isLoading = true;


        this.authService
            .login({
                email: this.email.trim(),
                password: this.password
            })
            .subscribe({

                next: response => {

                    console.log(
                        'Login exitoso:',
                        response
                    );

                    this.isLoading = false;

                    this.router.navigate([
                        '/dashboard'
                    ]);
                },


                error: error => {

                    console.error(
                        'Error de login:',
                        error
                    );

                    this.isLoading = false;


                    if (error.status === 401) {

                        this.errorMessage =
                            'Correo o contraseña incorrectos.';

                    } else if (error.status === 403) {

                        this.errorMessage =
                            'Tu usuario no tiene acceso.';

                    } else {

                        this.errorMessage =
                            'No se pudo iniciar sesión. Inténtalo nuevamente.';
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


    // =====================================================
    // CLEAR ERROR
    // =====================================================

    clearError(): void {

        if (this.errorMessage) {

            this.errorMessage = '';
        }
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
    // REGISTER
    // =====================================================

    goToRegister(): void {

        this.router.navigate([
            '/register'
        ]);
    }
}