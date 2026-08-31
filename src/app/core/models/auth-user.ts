export type UserRole =
    | 'CONSULTOR'
    | 'OPERADOR_FLNOC'
    | 'SUPERVISOR'
    | 'ADMIN';


export interface AuthUser {

    id: string;

    firstName: string;

    lastName: string;

    email: string;

    role: UserRole;
}