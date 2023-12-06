import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

interface SignupParams {
    email: string;
    password: string;
    name: string;
    phone: string;
}

interface SigninParams {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async signup(
        { email, password, name, phone }: SignupParams,
        userType: UserType,
    ) {
        const userExists = this.prismaService.user.findUnique({
            where: {
                email,
            },
        });

        if (!userExists) throw new ForbiddenException();

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prismaService.user.create({
            data: {
                email,
                name,
                phone,
                password: hashedPassword,
                user_type: userType,
            },
        });

        const token = await this.getTokens(user.id, name);

        return { access_token: token };
    }

    async signin({ email, password }: SigninParams) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            throw new ForbiddenException('User not found!');
        }

        const matchesPassword = await bcrypt.compare(password, user.password);
        if (!matchesPassword) throw new ForbiddenException('Access denied');
        const token = await this.getTokens(user.id, user.name);
        return token;
    }

    async getTokens(userId: number, name: string) {
        const at = await this.jwtService.signAsync(
            {
                sub: userId,
                name,
            },
            {
                secret: 'at-secret',
                expiresIn: 60 * 15,
            },
        );

        return {
            access_token: at,
        };
    }

    generateProductKey(email: string, userType: UserType) {
        const key = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

        return bcrypt.hash(key, 10);
    }
}
