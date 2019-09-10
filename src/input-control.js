// @ts-check

import { Thingy52Service } from './thingy52-service';

export const InputControl = new class extends EventTarget {
    constructor() {
        super();

        this.onThingy52Disconnect = this.onThingy52Disconnect.bind(this);
        this.onThingy52Velocity = this.onThingy52Velocity.bind(this);

        this._playerLink = [];

        this.velocity = {
            left: {
                upKey: 0,
                downKey: 0,
                thingyAccel: 0,
                value: 0
            },
            right: {
                upKey: 0,
                downKey: 0,
                thingyAccel: 0,
                value: 0
            }
        }
    }

    initialize() {
        Thingy52Service.addEventListener('disconnect', this.onThingy52Disconnect);
        Thingy52Service.addEventListener('velocity-change', this.onThingy52Velocity);

        // setup key bindings
        const _CONTROLS = {
            "KeyQ": (val) => {this.velocity.left.upKey = val},
            "KeyZ": (val) => {this.velocity.left.downKey = val},
            "KeyO": (val) => {this.velocity.right.upKey = val},
            "KeyM": (val) => {this.velocity.right.downKey = val}
        }

        document.addEventListener('keydown', evt => {
            // https://bugs.chromium.org/p/chromium/issues/detail?id=843558#c6
            if(!evt.repeat) {
                const ctrl = _CONTROLS[evt.code];
                if(ctrl) {
                    ctrl(1);
                    this.calcVelocity();
                    evt.preventDefault();
                } else {
                    console.log('pressed: ', evt.code);
                }
            }
        });

        document.addEventListener('keyup', evt => {
            if(!evt.repeat) {
                const ctrl = _CONTROLS[evt.code];
                if(ctrl) {
                    ctrl(0);
                    this.calcVelocity();
                    evt.preventDefault();
                } else {
                    console.log('released: ', evt.code);
                }
            }
        });
    }

    calcVelocity() {
        const leftV = (this.velocity.left.downKey - this.velocity.left.upKey) + this.velocity.left.thingyAccel;
        if (leftV !== this.velocity.left.value) {
            this.velocity.left.value = leftV;
            this.dispatchEvent(new CustomEvent('velocity-change', {detail: {player: 'left', value: this.velocity.left.value}}));
        }

        const rightV = (this.velocity.right.downKey - this.velocity.right.upKey) + this.velocity.right.thingyAccel;
        if (rightV !== this.velocity.right.value) {
            this.velocity.right.value = rightV;
            this.dispatchEvent(new CustomEvent('velocity-change', {detail: {player: 'right', value: this.velocity.right.value}}));
        }

        console.log(this.velocity);
    }

    onThingy52Disconnect(evt) {
        const deviceId = evt.detail;

        const idx = this._playerLink.findIndex(v => v.deviceId === deviceId);

        if (idx !== -1) {
            const dropped = this._playerLink.splice(idx, 1)[0];

            console.log(`Player ${dropped.player} disconnected Thingy: ${dropped.deviceId}`, this._playerLink);
            this.dispatchEvent(new CustomEvent('change', {detail: {player: dropped.player, state: 'disconnected'}}));

            if (dropped.player === 'left') {
                this.velocity.left.thingyAccel = 0;
                this.calcVelocity();
            } else if (dropped.player === 'right') {
                this.velocity.right.thingyAccel = 0;
                this.calcVelocity();
            }
        }
    }

    onThingy52Velocity(evt) {
        const playerLink = this._playerLink.find(v => v.deviceId === evt.detail.deviceId);

        if (playerLink) {
            if (playerLink.player === 'left') {
                this.velocity.left.thingyAccel = evt.detail.velocity;
                this.calcVelocity();
            } else if (playerLink.player === 'right') {
                this.velocity.right.thingyAccel = evt.detail.velocity;
                this.calcVelocity();
            }
        }
    }

    async toggleThingy52(player, color) {
        const playerLink = this._playerLink.find(v => v.player === player);


        if (playerLink) {
            Thingy52Service.disconnect(playerLink.deviceId);
        } else {
            await this.connectThingy52(player, color);
        }
    }

    async connectThingy52(player, color) {
        const deviceId = await Thingy52Service.scan();

        if (deviceId) {
            Thingy52Service.setLED(deviceId, color);

            this._playerLink.push({player, deviceId, color});

            console.log(`Player ${player} connected to Thingy: ${deviceId}`, this._playerLink);
            this.dispatchEvent(new CustomEvent('change', {detail: {player, state: 'connected'}}));
        } else {
            this.dispatchEvent(new CustomEvent('change', {detail: {player, state: 'disconnected'}}));
        }
    }
}