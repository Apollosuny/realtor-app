import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import {
    CreateHomeDto,
    HomeResponseDto,
    InquireDto,
    UpdateHomeDto,
} from './dto/home.dto';
import { PropertyType, UserType } from '@prisma/client';
import { User, UserTypeDecorator } from 'src/user/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('home')
export class HomeController {
    constructor(private homeService: HomeService) {}

    @Get()
    getHomes(
        @Query('city') city?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('propertyType') propertyType?: PropertyType,
    ): Promise<HomeResponseDto[]> {
        const price =
            minPrice || maxPrice
                ? {
                      ...(minPrice && { gte: parseFloat(minPrice) }),
                      ...(maxPrice && { lte: parseFloat(maxPrice) }),
                  }
                : undefined;

        const filters = {
            ...(city && { city }),
            ...(price && { price }),
            ...(propertyType && { propertyType }),
        };
        return this.homeService.getHomes(filters);
    }

    @Get(':id')
    getHome(@Param('id', ParseIntPipe) id: number) {
        return this.homeService.getHomeById(id);
    }

    @Roles(UserType.REALTOR, UserType.ADMIN)
    @Post()
    createHome(@Body() body: CreateHomeDto, @User() user: UserTypeDecorator) {
        // return this.homeService.createHome(body, user.id);
        return 'Created Home';
    }

    @Roles(UserType.REALTOR, UserType.ADMIN)
    @Put(':id')
    async updateHome(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateHomeDto,
        @User() user: UserTypeDecorator,
    ) {
        const realtor = await this.homeService.getRealtorByHomeId(id);

        if (realtor.id !== user.id) {
            throw new UnauthorizedException();
        }
        return this.homeService.updateHomeById(id, body);
    }

    @Roles(UserType.REALTOR, UserType.ADMIN)
    @Delete(':id')
    async deleteHome(
        @Param('id', ParseIntPipe) id: number,
        @User() user: UserTypeDecorator,
    ) {
        const realtor = await this.homeService.getRealtorByHomeId(id);

        if (realtor.id !== user.id) {
            throw new UnauthorizedException();
        }
        return this.homeService.deleteHomeById(id);
    }

    @Roles(UserType.BUYER)
    @Post(':id/inquire')
    inquire(
        @Param('id', ParseIntPipe) homeId: number,
        @User() user: UserTypeDecorator,
        @Body() { message }: InquireDto,
    ) {
        return this.homeService.inquire(user, homeId, message);
    }

    @Roles(UserType.REALTOR)
    @Get(':id/messages')
    async getHomeMessages(
        @Param('id', ParseIntPipe) id: number,
        @User() user: UserTypeDecorator,
    ) {
        const realtor = await this.homeService.getRealtorByHomeId(id);

        if (realtor.id !== user.id) {
            throw new UnauthorizedException();
        }
        return this.homeService.getMessagesByHome(id);
    }
}
