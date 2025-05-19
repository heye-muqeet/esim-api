// src/sim-details/dto/update-sim-details.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateSimDetailsDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  esimTranNo?: string;

  @IsOptional()
  @IsString()
  iccid?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}