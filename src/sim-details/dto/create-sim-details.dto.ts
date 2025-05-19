// src/sim-details/dto/create-sim-details.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSimDetailsDto {
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @IsString()
  @IsOptional()
  esimTranNo?: string;

  @IsString()
  @IsOptional()
  iccid?: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;
}