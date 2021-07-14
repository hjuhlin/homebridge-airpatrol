import { Service, PlatformAccessory, Logger, PlatformConfig } from 'homebridge';

import { AirPatrolHomebridgePlatform } from '../platform';
import { List2 } from '../types/ParingListObject';

export class ThermometerAccessory {
  private service: Service;

  constructor(
    private readonly platform: AirPatrolHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: List2,
    public readonly config: PlatformConfig,
    public readonly log: Logger,
    private readonly SubName: string,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'AirPatrol')
      .setCharacteristic(this.platform.Characteristic.Model, 'AirPatrolThermostat')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.id+'_'+SubName);

    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
    this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.service = this.accessory.getService(this.platform.Service.HumiditySensor) ||
    this.accessory.addService(this.platform.Service.HumiditySensor);

    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name + ' ('+SubName+')');
  }
}