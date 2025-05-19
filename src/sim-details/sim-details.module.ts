// src/sim-details/sim-details.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimDetailsService } from './sim-details.service';
import { SimDetailsController } from './sim-details.controller';
import { SimDetails } from 'src/typeorm/entities/sim-details.entity';
import { User } from 'src/typeorm/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SimDetails, User])],
  providers: [SimDetailsService],
  controllers: [SimDetailsController],
  exports: [SimDetailsService],
})
export class SimDetailsModule {}