import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
      private prisma: PrismaService
  ){}
  
  async findByEmail(email: string){
    const find = await this.prisma.user.findUnique({
      where:{
        email
      }
    })
    return find
  }

  async createUser(email: string){
    const findByEmail = await this.findByEmail(email)
    if(findByEmail){
      throw new ConflictException('User already exists') 
    }
    const createUser = await this.prisma.user.create({
      data:{
        email
      }
    })
    return createUser
  }

}
