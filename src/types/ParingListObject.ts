export interface List {
    id: string;
    pairingId: string;
    userId: string;
}

export interface PairingUser {
    list: List[];
}

export interface List2 {
    appId: string;
    cid: string;
    hwid: string;
    id: string;
    name: string;
    type: string;
}

export interface Pairings {
    list: List2[];
}

export interface List3 {
    firstName: string;
    id: string;
    lastName: string;
}

export interface Users {
    list: List3[];
}

export interface Entities {
    pairingUser: PairingUser;
    pairings: Pairings;
    users: Users;
}

export interface Misc {
}

export interface ParingListObject {
    entities: Entities;
    errors: any[];
    misc: Misc;
    status: string;
}