// src/typeorm/entities/sim-details.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class SimDetails {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => User, user => user.simDetails)
  user: User;

  @Column({ unique: true })
  orderNo: string;

  @Column({ unique: true, nullable: true }) // Make optional
  esimTranNo?: string;

  @Column({ unique: true, nullable: true }) // Make optional
  iccid?: string;

  @Column() // Make required (not nullable)
  transactionId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}