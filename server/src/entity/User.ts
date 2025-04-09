import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  clientId: string; // Browser/client identifier

  @Column()
  name: string;

  @Column({ default: '👤' })
  emoji: string;

  @Column({ default: 0 })
  bestWpm: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  wordsCompleted: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
