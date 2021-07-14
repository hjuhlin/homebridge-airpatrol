const request = require('request');

import { PlatformConfig, Logger } from 'homebridge';

export class HttpRequest {

  readonly urlCommand = 'https://api.apsrvd.io/11/command';
  readonly urlParingList = 'https://auth.apsrvd.io/v1/pairings';

  constructor(
    public readonly config: PlatformConfig,
    public readonly log: Logger,
  ) {}

  createInstance() {
    return {};
  }

  GetParingList(token: string) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: this.urlParingList,
          method: 'GET',
          headers: {
            'Authorization': token,
            'User-Agent': 'AirPatrol/5 CFNetwork/1240.0.4 Darwin/20.5.0',
          },
          json: true,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
    });
  }

  GetStatus(token: string, xPairingId) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: this.urlCommand,
          method: 'GET',
          headers: {
            'Authorization': token,
            'User-Agent': 'AirPatrol/5 CFNetwork/1240.0.4 Darwin/20.5.0',
            'X-Pairing-Id': xPairingId,
          },
          json: true,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
    });
  }


  ChangePowerOfDevice(xPairingId: string, whatToDo: string, token: string) {
    let body = '"PumpMode":"cool","FanSpeed":"auto","Swing":"off","PumpTemp":"22.000","PumpPower":"off"';

    if(whatToDo!=='off') {
      body = '"PumpMode":"'+whatToDo+'","FanSpeed":"auto","Swing":"off","PumpTemp":"22.000","PumpPower":"on"';
    }

    return new Promise((resolve, reject) => {
      request(
        {
          url: this.urlCommand,
          method: 'POST',
          headers: {
            'Authorization': token,
            'User-Agent': 'AirPatrol/5 CFNetwork/1240.0.4 Darwin/20.5.0',
            'X-Pairing-Id': xPairingId,
          },
          body: '{"CommandMode":"parameters","ParametersData":{'+body+'}}',
        }, (error, response, body) => {
          if (error) {
            this.log.error(error);
            reject(error);
          } else {
            this.log.info(response.statusCode);
            resolve(body);
          }
        });
    });
  }

  // ChangeTargetTemperatureOfDevice(deviceCode: string, value: string, token: string) {
  //   return new Promise((resolve, reject) => {
  //     request(
  //       {
  //         url: this.urlUpdateDevice,
  //         method: 'POST',
  //         headers: {
  //           'x-token': token,
  //         },
  //         body: {
  //           param: [{
  //             device_code: deviceCode,
  //             value: value,
  //             protocol_code: 'R02',
  //           }],
  //         },
  //         json: true,
  //       }, (error, response, body) => {
  //         if (response.statusCode === 401) {
  //           reject('NotLoggedIn');
  //         }

  //         if (error) {
  //           reject(error);
  //         } else {
  //           resolve(body);
  //         }
  //       });
  //   });
  // }
}