export interface ParametersData {
    FanSpeed: string;
    PumpMode: string;
    PumpPower: string;
    PumpTemp: string;
    Swing: string;
}

export interface AirPatrolObject {
    ApiVersion: string;
    CommandMode: string;
    ParametersData: ParametersData;
    RoomHumidity: string;
    RoomTemp: string;
}