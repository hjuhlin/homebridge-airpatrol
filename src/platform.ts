import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { ThermometerAccessory } from './accessories/ThermometerAccessory';
import { ThermostatAccessory } from './accessories/ThermostatAccessory';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AirPatrolObject } from './types/AirPatrolObject';
import { List2, ParingListObject } from './types/ParingListObject';
import { HttpRequest } from './utils/httprequest';

export class AirPatrolHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public Token = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.Token = this.config['Token'] as string;

      this.discoverDevices();
      this.updateDeviceStatus();

      setInterval(() => {
        this.updateDeviceStatus();
      }, (this.config['UpdateTime'] as number) * 1000);

    });
  }

  updateDeviceStatus() {
    const httpRequest = new HttpRequest(this.config, this.log);

    this.accessories.forEach(accessory => {
      const device = accessory.context.device as List2;

      httpRequest.GetStatus(this.Token, device.id).then((results)=> {
        if (results!==undefined) {
          const aquaTempObject = <AirPatrolObject>results;

          if (accessory.context.type==='thermometer') {
            const thermostatService = accessory.getService(this.Service.TemperatureSensor);
            const humiditySensorService = accessory.getService(this.Service.HumiditySensor);

            if (thermostatService!==undefined) {
              this.log.info('Update CurrentRoomTemperature', aquaTempObject.RoomTemp);
              thermostatService.updateCharacteristic(this.Characteristic.CurrentTemperature, aquaTempObject.RoomTemp);
            }

            if (humiditySensorService!==undefined) {
              this.log.info('Update CurrentRoomRelativeHumidity', aquaTempObject.RoomHumidity);
              humiditySensorService.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, aquaTempObject.RoomHumidity);
            }
          }

          if (accessory.context.type==='thermostat') {
            const thermostatService = accessory.getService(this.Service.Thermostat);

            if (thermostatService!==undefined) {
              thermostatService.updateCharacteristic(this.Characteristic.CurrentTemperature, aquaTempObject.RoomTemp);
              thermostatService.updateCharacteristic(this.Characteristic.TargetTemperature, aquaTempObject.ParametersData.PumpTemp);

              const pumpMood = aquaTempObject.ParametersData.PumpMode;
              let targetHeatingCoolingState = this.Characteristic.TargetHeatingCoolingState.OFF;

              if (pumpMood==='cool') {
                targetHeatingCoolingState= this.Characteristic.TargetHeatingCoolingState.COOL;
              }

              if (pumpMood==='auto') {
                targetHeatingCoolingState= this.Characteristic.TargetHeatingCoolingState.AUTO;
              }

              if (pumpMood==='heat') {
                targetHeatingCoolingState= this.Characteristic.TargetHeatingCoolingState.HEAT;
              }

              if (aquaTempObject.ParametersData.PumpPower === 'off') {
                targetHeatingCoolingState= this.Characteristic.TargetHeatingCoolingState.OFF;
              }

              thermostatService.updateCharacteristic(this.Characteristic.TargetHeatingCoolingState, targetHeatingCoolingState);
              thermostatService.updateCharacteristic(this.Characteristic.CurrentHeatingCoolingState, targetHeatingCoolingState);

              this.log.info('Update TargetHeatingCoolingState / CurrentHeatingCoolingState ', targetHeatingCoolingState);
            }
          }
        }
      });
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  discoverDevices() {

    // this.accessories.forEach(accessory => {
    //   this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    //   this.log.info('Removing existing accessory:', accessory.displayName);
    // });

    const httpRequest = new HttpRequest(this.config, this.log);

    httpRequest.GetParingList(this.Token).then((results)=> {

      if (results!==undefined) {
        const airPatrolObject = <ParingListObject>results;

        if (airPatrolObject.entities!==undefined) {
          if (airPatrolObject.entities.pairings!==undefined) {
            for (const device of airPatrolObject.entities.pairings.list) {
              const thermometerObject = this.getAccessory(device, 'thermometer');
              new ThermometerAccessory(this, thermometerObject.accessory, device, this.config, this.log, 'thermometer');
              this.addOrRestorAccessory(thermometerObject.accessory, device.name, 'thermometer', thermometerObject.exists);

              const thermostatObject = this.getAccessory(device, 'thermostat');
              new ThermostatAccessory(this, thermostatObject.accessory, device, this.config, this.log, 'heater');
              this.addOrRestorAccessory(thermostatObject.accessory, device.name, 'thermostat', thermostatObject.exists);
            }
          }
        }

        this.accessories.forEach(accessory => {
          let found = false;

          for (const device of airPatrolObject.entities.pairings.list) {
            if (accessory.UUID === this.localIdForType(device, 'thermostat') ||
            accessory.UUID === this.localIdForType(device, 'thermometer')) {
              found = true;
            }
          }

          if (found === false) {
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            this.log.info('Removing existing accessory:', accessory.displayName);
          }
        });
      }
    });
  }

  public getAccessory(device: List2, type: string) {
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === this.localIdForType(device, type));

    if (existingAccessory!==undefined) {
      existingAccessory.context.type=type;
      existingAccessory.context.device=device;

      return {accessory : existingAccessory, exists : true};
    }

    const accessory = new this.api.platformAccessory(device.name, this.localIdForType(device, type));

    accessory.context.device = device;
    accessory.context.type = type;

    return {accessory : accessory, exists : false};
  }

  public addOrRestorAccessory(accessory: PlatformAccessory<Record<string, unknown>>, name: string, type: string, exists: boolean) {
    if (exists) {
      this.log.info('Restoring existing accessory:', name +' ('+type+')');
      this.api.updatePlatformAccessories([accessory]);
    } else {
      this.log.info('Adding new accessory:', name +' ('+type+')');
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  localIdForType(device:List2, type:string):string {
    return this.api.hap.uuid.generate(device.id.toString()+'_'+type);
  }
}
