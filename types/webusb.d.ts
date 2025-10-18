
// Type definitions for WebUSB API
// Project: https://wicg.github.io/webusb/
// Definitions by: Lars <https://github.com/lars-go>

interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
    serialNumber?: string;
}

interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
}

interface USBConnectionEvent extends Event {
    readonly device: USBDevice;
}

interface USB extends EventTarget {
    onconnect: ((this: this, ev: USBConnectionEvent) => any) | null;
    ondisconnect: ((this: this, ev: USBConnectionEvent) => any) | null;
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
}

interface Navigator {
    readonly usb: USB;
}

type USBDirection = "in" | "out";
type USBRequestType = "standard" | "class" | "vendor";
type USBRecipient = "device" | "interface" | "endpoint" | "other";
type USBTransferStatus = "ok" | "stall" | "babble";

interface USBTransferResult {
    readonly status: USBTransferStatus;
    readonly bytesWritten?: number;
}

interface USBIsochronousTransferResult {
    readonly packets: USBIsochronousPacket[];
}

interface USBIsochronousTransferInResult extends USBIsochronousTransferResult {
    readonly data?: DataView;
}

interface USBIsochronousTransferOutResult extends USBIsochronousTransferResult {
    readonly bytesWritten: number;
}

interface USBIsochronousPacket {
    readonly status: USBTransferStatus;
    readonly bytesWritten?: number;
}

interface USBInTransferResult {
    readonly data?: DataView;
    readonly status: USBTransferStatus;
}

interface USBOutTransferResult {
    readonly bytesWritten: number;
    readonly status: USBTransferStatus;
}

interface USBControlParameters {
    requestType: USBRequestType;
    recipient: USBRecipient;
    request: number;
    value: number;
    index: number;
}

interface USBDevice {
    readonly usbVersionMajor: number;
    readonly usbVersionMinor: number;
    readonly usbVersionSubminor: number;
    readonly deviceClass: number;
    readonly deviceSubclass: number;
    readonly deviceProtocol: number;
    readonly vendorId: number;
    readonly productId: number;
    readonly deviceVersionMajor: number;
    readonly deviceVersionMinor: number;
    readonly deviceVersionSubminor: number;
    readonly manufacturerName?: string;
    readonly productName?: string;
    readonly serialNumber?: string;
    readonly configuration?: USBConfiguration;
    readonly configurations: USBConfiguration[];
    readonly opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
    controlTransferIn(setup: USBControlParameters, length: number): Promise<USBInTransferResult>;
    controlTransferOut(setup: USBControlParameters, data?: BufferSource): Promise<USBOutTransferResult>;
    clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>;
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousTransferInResult>;
    isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousTransferOutResult>;
    reset(): Promise<void>;
}

interface USBConfiguration {
    readonly configurationValue: number;
    readonly configurationName?: string;
    readonly interfaces: USBInterface[];
}

interface USBInterface {
    readonly interfaceNumber: number;
    readonly alternate: USBAlternateInterface;
    readonly alternates: USBAlternateInterface[];
    readonly claimed: boolean;
}

interface USBAlternateInterface {
    readonly alternateSetting: number;
    readonly interfaceClass: number;
    readonly interfaceSubclass: number;
    readonly interfaceProtocol: number;
    readonly interfaceName?: string;
    readonly endpoints: USBEndpoint[];
}

type USBEndpointType = "bulk" | "interrupt" | "isochronous";

interface USBEndpoint {
    readonly endpointNumber: number;
    readonly direction: USBDirection;
    readonly type: USBEndpointType;
    readonly packetSize: number;
}
