// src/user/dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  photo: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}