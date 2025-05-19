// src/sim-details/sim-details.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateSimDetailsDto } from './dto/create-sim-details.dto';
import { UpdateSimDetailsDto } from './dto/update-sim-details.dto';
import { SimDetails } from 'src/typeorm/entities/sim-details.entity';
import { User } from 'src/typeorm/entities/user.entity';

@Injectable()
export class SimDetailsService {
    constructor(
        @InjectRepository(SimDetails)
        private readonly simDetailsRepository: Repository<SimDetails>,
    ) { }

    // sim-details.service.ts
    async create(user: User, createSimDetailsDto: CreateSimDetailsDto): Promise<SimDetails> {
        console.log('Creating with:', { user: user.id, dto: createSimDetailsDto });

        // Check for duplicates (only for non-null fields)
        const { orderNo, esimTranNo, iccid, transactionId } = createSimDetailsDto;
        const conditions: FindOptionsWhere<SimDetails>[] = [{ orderNo }];
        if (esimTranNo) conditions.push({ esimTranNo });
        if (iccid) conditions.push({ iccid });

        const existing = await this.simDetailsRepository.findOne({
            where: conditions,
        });
        if (existing) {
            throw new BadRequestException('Order number, eSIM transaction number, or ICCID already exists');
        }

        // Create entity using repository.create
        const simDetails = this.simDetailsRepository.create({
            orderNo,
            esimTranNo,
            iccid,
            transactionId,
            user,
        });

        // Log entity state
        console.log('Entity before save:', {
            id: simDetails.id,
            orderNo: simDetails.orderNo,
            esimTranNo: simDetails.esimTranNo,
            iccid: simDetails.iccid,
            transactionId: simDetails.transactionId,
            userId: simDetails.user?.id,
        });

        try {
            // Use insert to force an insert operation
            await this.simDetailsRepository.insert(simDetails);

            // Fetch the inserted entity
            const savedSimDetails = await this.simDetailsRepository.findOne({
                where: { orderNo, transactionId }, // Use orderNo and transactionId since they’re required
                relations: ['user'],
            });

            if (!savedSimDetails) {
                throw new BadRequestException('Failed to retrieve newly created SIM details');
            }

            console.log('Creation successful:', savedSimDetails);
            return savedSimDetails;
        } catch (error) {
            console.error('Creation failed:', JSON.stringify(error, null, 2));
            if (error.code === 'ER_DUP_ENTRY') {
                throw new BadRequestException('Duplicate entry for orderNo, esimTranNo, or iccid');
            }
            throw new BadRequestException(`Failed to create SIM details: ${error.message}`);
        }
    }

    async findAllByUser(userId: number): Promise<SimDetails[]> {
        return this.simDetailsRepository.find({
            where: { user: { id: userId } },
            relations: ['user'],
        });
    }

    async findOne(id: number, userId: number): Promise<SimDetails> {
        const simDetails = await this.simDetailsRepository.findOne({
            where: { id, user: { id: userId } },
            relations: ['user'],
        });

        if (!simDetails) {
            throw new NotFoundException('SIM details not found');
        }

        return simDetails;
    }

    async update(
        id: number,
        userId: number,
        updateSimDetailsDto: UpdateSimDetailsDto,
    ): Promise<SimDetails> {
        // First check if there are actual values to update
        if (Object.keys(updateSimDetailsDto).length === 0) {
            throw new BadRequestException('No update values provided');
        }

        // Find the existing record
        const existing = await this.simDetailsRepository.findOne({
            where: { id, user: { id: userId } },
        });

        if (!existing) {
            throw new NotFoundException('SIM details not found');
        }

        // Merge the changes
        const updated = this.simDetailsRepository.merge(existing, updateSimDetailsDto);

        // Save the updated record
        return this.simDetailsRepository.save(updated);
    }

    async remove(id: number, userId: number): Promise<void> {
        const simDetails = await this.simDetailsRepository.findOne({
            where: { id, user: { id: userId } },
        });

        if (!simDetails) {
            throw new NotFoundException('SIM details not found or not owned by user');
        }

        await this.simDetailsRepository.remove(simDetails);
    }
}