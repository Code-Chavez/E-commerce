import { ISystemSettingRepository } from '@domain/repositories/ISystemSettingRepository';

export class GetSystemSettingsUseCase {
  constructor(private settingRepository: ISystemSettingRepository) {}

  async execute() {
    return this.settingRepository.getAll();
  }
}
