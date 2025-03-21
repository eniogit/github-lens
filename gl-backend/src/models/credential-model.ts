import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user-model';

@Entity()
export class Credential {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column()
  accessToken: string;
  @Column()
  refreshToken: string;
  @Column({ type: 'timestamp' })
  expiresAt: Date;
  @Column({ type: 'timestamp' })
  refreshTokenExpiresAt: Date;
  @Column()
  provider: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
