import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../typeorm/entities/user.entity';

type Response = {
  success: boolean;
  message: string;
  user: UserResponseDto;
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async signUp(signUpDto: SignUpDto): Promise<Response> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const user = this.usersRepository.create({
      name: signUpDto.name,
      email: signUpDto.email,
      password: hashedPassword,
    });
    const newUser = await this.usersRepository.save(user);
    const accessToken = this.generateToken(newUser.id);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      accessToken: accessToken.accessToken,
    };
  }

  async login(user: User): Promise<Response> {
    console.log('loging in user', user);
    const accessToken = this.generateToken(user.id);

    return {
      success: true,
      message: 'User Login successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken: accessToken.accessToken,
    };
  }

  private generateToken(userId: number) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        // expiresIn: process.env.JWT_EXPIRES_IN,
      }),
    };
  }
}