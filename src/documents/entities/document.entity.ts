import { User } from '../../users/entities/user.entity';

import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

@Table({
  paranoid: true,
  timestamps: true,
  freezeTableName: true,
  tableName: 'documents',
})
export class Document extends Model<Document> {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  path: string;

  @Column({
    type: DataType.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false,
  })
  status: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  uploadedBy: number;

  @BelongsTo(() => User)
  user: User;
}
