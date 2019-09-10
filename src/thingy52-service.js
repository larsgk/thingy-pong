// @ts-check
export const Thingy52Service = new class extends EventTarget {
    constructor() {
        super();

        this._onAccelChange = this._onAccelChange.bind(this);
        this._onButtonChange = this._onButtonChange.bind(this);

        this._devices = new Map();

        this._control = new Map();

        this._velocity = new Map();
    }

    async scan() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['ef680100-9b35-4933-9b10-52ffa9740042'] }],
                optionalServices: [
                    "ef680200-9b35-4933-9b10-52ffa9740042",
                    "ef680300-9b35-4933-9b10-52ffa9740042",
                    "ef680400-9b35-4933-9b10-52ffa9740042",
                    "ef680500-9b35-4933-9b10-52ffa9740042"
                ]
            });

            return await this._attachDevice(device);
        } catch (err) {
            console.log(err); // No device was selected.
        }
    }

    // When the GATT server is disconnected, remove the device from the list
    _deviceDisconnected(device) {
        console.log('Disconnected', device);

        if(this._devices.has(device.id)) {
            this._devices.delete(device.id);
            this._control.delete(device.id);
            this._velocity.delete(device.id);
            this.onDisconnected(device.id);
        }
    }

    onDisconnected(deviceId) {
        this.dispatchEvent(new CustomEvent('disconnect', {detail: deviceId}));
    }

    async _attachDevice(device) {
        if(this._devices.has(device.id)) {
            console.log("Device already connected: ", device.id);
            return;
        }

        const server = await device.gatt.connect();

        await this._startAccelerometerNotifications(server);
        await this._startButtonClickNotifications(server);

        const led = await this._getLedCharacteristic(server);

        this._devices.set(device.id, device);
        this._control.set(device.id, {led});
        this._velocity.set(device.id, 0);

        device.ongattserverdisconnected = _ => this._deviceDisconnected(device);

        return device.id;
    }

    setLED(deviceId, color) {
        const control = this._control.get(deviceId);

        if (control && control.led) {
            const hexToRGB = hex => hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16));
            const arr = hexToRGB(color);
            return control.led.writeValue(new Uint8Array([1, ...arr]));
        }
    }

    _onAccelChange(event) {
        const target = event.target;
        const deviceId = target.service.device.id;

        const accel = {
          x: +target.value.getFloat32(0, true).toPrecision(5),
          y: +target.value.getFloat32(4, true).toPrecision(5),
          z: +target.value.getFloat32(8, true).toPrecision(5)
        };

        const velocity = Math.min(10, Math.max(-10, Math.round(accel.x)));

        const oldVelocity = this._velocity.get(deviceId);

        if (velocity != oldVelocity) {
            this._velocity.set(deviceId, velocity);
            this.dispatchEvent(new CustomEvent('velocity-change', {detail: {deviceId, velocity: velocity*0.5}}));
        }
    }

    _onButtonChange(event) {
        const target = event.target;
        const deviceId = target.service.device.id;

        const buttonPressed = target.value.getUint8(0) === 1;

        console.log(buttonPressed ? "BUTTON[DOWN]" : "BUTTON[UP]");
    }

    async _startAccelerometerNotifications(server) {
        const service = await server.getPrimaryService('ef680400-9b35-4933-9b10-52ffa9740042');
        const characteristic = await service.getCharacteristic('ef68040a-9b35-4933-9b10-52ffa9740042');
        characteristic.addEventListener('characteristicvaluechanged', this._onAccelChange);
        return characteristic.startNotifications();
      }

    async _startButtonClickNotifications(server) {
        const service = await server.getPrimaryService('ef680300-9b35-4933-9b10-52ffa9740042');
        const characteristic = await service.getCharacteristic('ef680302-9b35-4933-9b10-52ffa9740042');
        characteristic.addEventListener('characteristicvaluechanged', this._onButtonChange);
        return characteristic.startNotifications();
    }

    async _getLedCharacteristic(server) {
        const service = await server.getPrimaryService('ef680300-9b35-4933-9b10-52ffa9740042');
        return await service.getCharacteristic('ef680301-9b35-4933-9b10-52ffa9740042');
    }

    disconnect(deviceId) {
        const device = this._devices.get(deviceId);

        if (device) {
            device.gatt.disconnect();
        }
    }
}