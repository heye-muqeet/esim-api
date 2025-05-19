import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserParams } from '../utils/types';
import { User } from '../typeorm/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) { }

  createUser(createDetails: CreateUserParams) {
    const newUser = this.userRepository.create(createDetails);
    return this.userRepository.save(newUser);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: number, updateDetails: Partial<User>) {
    if (!id) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!updateDetails || Object.keys(updateDetails).length === 0) {
      throw new BadRequestException('No update details provided');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(id, updateDetails);
    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }
}