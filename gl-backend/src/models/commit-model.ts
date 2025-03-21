import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Repo } from './repo-model';

@Entity()
export class CommitCounts {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Repo, { nullable: false })
  repo: Repo;

  @Column({ nullable: false })
  date: Date;

  @Column({ nullable: false })
  commit_count: number;
}
