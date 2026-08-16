export type UserRole =
    | 'USER'
    | 'ESTABLISHMENT'
    | 'MODERATOR'
    | 'ADMIN';


export interface AuthUser {

    id: string;

    firstName: string;

    lastName: string;

    email: string;

    role: UserRole;
}