import { UserType } from '@prisma/client';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    MinLength,
    Matches,
    IsEnum,
    IsOptional,
} from 'class-validator';

const regExp =
    /^[+]?[0-9]{0,1}[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/gm;

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @Matches(regExp, { message: 'Phone must be a valid phone number' })
    phone: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(5)
    password: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    productKey?: string;
}

export class SigninDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class GenerateProductKeyDto {
    @IsEmail()
    email: string;

    @IsEnum(UserType)
    userType: UserType;
}
