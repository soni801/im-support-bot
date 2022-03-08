import { MigrationInterface, QueryRunner } from 'typeorm';

export class setup1646759720893 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner
      .createDatabase(queryRunner.connection.options.database as string)
      .catch((err) => {
        console.log(err);
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
