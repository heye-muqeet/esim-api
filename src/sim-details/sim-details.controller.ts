import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SimDetailsService } from './sim-details.service';
import { CreateSimDetailsDto } from './dto/create-sim-details.dto';
import { UpdateSimDetailsDto } from './dto/update-sim-details.dto';
import { Request } from 'express';
import { User } from '../typeorm/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sim-details')
@UseGuards(JwtAuthGuard)
export class SimDetailsController {
  constructor(private readonly simDetailsService: SimDetailsService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createSimDetailsDto: CreateSimDetailsDto,
  ) {
    console.log('Raw request body:', req.body);
    console.log('Parsed DTO:', createSimDetailsDto);
    console.log('User:', req.user);

    try {
      const user = req.user as User;
      const result = await this.simDetailsService.create(user, createSimDetailsDto);
      return result;
    } catch (error) {
      console.error('Full error stack:', error);
      throw new BadRequestException('Failed to create SIM details: ' + error.message);
    }
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.simDetailsService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.simDetailsService.findOne(+id, user.id);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateSimDetailsDto: UpdateSimDetailsDto,
  ) {
    console.log('PATCH /sim-details/:id', { id, body: req.body, user: req.user });
    try {
      if (!id || isNaN(+id)) {
        throw new BadRequestException('Invalid ID parameter');
      }
      const user = req.user as User;
      return await this.simDetailsService.update(+id, user.id, updateSimDetailsDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update SIM details: ' + error.message);
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.simDetailsService.remove(+id, user.id);
    return { message: 'SIM details deleted successfully' };
  }
}