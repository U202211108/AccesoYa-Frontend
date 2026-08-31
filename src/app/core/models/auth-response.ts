import { Role } from './role';

export interface AuthResponse {

    token: string;

    id: string;

    firstName: string;

    lastName: string;

    email: string;

    role: Role;
}