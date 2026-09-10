export type ProfileType = 'CITIZEN' | 'ASSOCIATION' | 'MERCHANT';
export interface UserProfile{
    username:string;
    email: string;
    bio?: string;
    profileType: ProfileType;
}