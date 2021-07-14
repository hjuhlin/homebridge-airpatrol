import { Service, PlatformAccessory, Logger, PlatformConfig, CharacteristicValue } from 'homebridge';

import { AirPatrolHomebridgePlatform } from '../platform';
import { List2 } from '../types/ParingListObject';
import { HttpRequest } from '../utils/httprequest';

export class ThermostatAccessory {
  private service: Service;
  private startUp: boolean;

  constructor(
    private readonly platform: AirPatrolHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: List2,
    public readonly config: PlatformConfig,
    public readonly log: Logger,
    private readonly SubName: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const startUp = true;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'AirPatrol')
      .setCharacteristic(this.platform.Characteristic.Model, 'AirPatrolThermostat')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.id+'_heater');

    this.service = this.accessory.getService(this.platform.Service.Thermostat) ||
    this.accessory.addService(this.platform.Service.Thermostat);

    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name + ' ('+SubName+')');
    this.service.setCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits,
      this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState).setProps({
      minValue: 0,
      maxValue: 3,
      validValues: [0, 1, 2, 3],
    });

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState).setProps({
      minValue: 0,
      maxValue: 3,
      validValues: [0, 1, 2, 3],
    });

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState).onSet(this.setState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature).onSet(this.setTemperature.bind(this));

    this.startUp = false;
  }

  setState(value: CharacteristicValue) {
    if (this.startUp===true) {
      return;
    }

    let whatToDo = 'off';

    switch (value) {
      case this.platform.Characteristic.TargetHeatingCoolingState.HEAT:
        whatToDo='heat';
        break;

      case this.platform.Characteristic.TargetHeatingCoolingState.COOL:
        whatToDo='cool';
        break;

      case this.platform.Characteristic.TargetHeatingCoolingState.AUTO:
        whatToDo='auto';
        break;
    }

    const httpRequest = new HttpRequest(this.config, this.log);
    httpRequest.ChangePowerOfDevice(this.accessory.context.device.id, whatToDo, this.platform.Token).then((results)=> {

      this.log.info('Changed status to ', whatToDo);
    });
  }

  setTemperature(value: CharacteristicValue) {
    if (this.startUp===true) {
      return;
    }

    const temp = value as string;

    // const httpRequest = new HttpRequest(this.config, this.log);
    // httpRequest.ChangeTargetTemperatureOfDevice(this.accessory.context.device.device_code, temp, this.platform.Token).then((results)=> {

    //   const result = <AquaTempObject>results;

    //   if (result.is_reuslt_suc===false) {
    //     this.log.error(result.error_msg);
    //     this.log.error(result.error_code);
    //     this.log.error(result.error_msg_code);
    //   } else {
    //     this.log.info('Changed target temperature to ' +(value));
    //   }
    // }).catch((error) => {
    //   if (error==='NotLoggedIn') {
    //     this.platform.getToken(false);
    //   }
    // });
  }
}