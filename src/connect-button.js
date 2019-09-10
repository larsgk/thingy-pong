// @ts-check

import {LitElement, html, css} from 'lit-element';

import { InputControl } from './input-control';

export class ConnectButton extends LitElement {
    constructor() {
        super();

        this.player = 'N/A';
        this.state = 'disconnected';
        this.color = '#FFFFFF';
        this.inTransition = false;

        this.onInputChange = this.onInputChange.bind(this);
    }

    static get properties() {
        return {
            player: { type: String },
            color: { type: String }
        }
    }

    static get styles() {
        return [css`
            button {
                display: flex;
                height: 100%;
                width: 80px;
                border: none;
                background: black;
                align-items: center;
                justify-content: center;
                outline: none;
            }

            canvas {
                width: 70px;
                height: 70px;
            }

            `
        ]
    }

    render() {
        return html`
            <button class="score" @click=${this.toggleConnect}><canvas height=70 width=70></canvas></button>
        `;
    }

    firstUpdated() {
        /** @type {HTMLCanvasElement} */
        const canvas = this.shadowRoot.querySelector('canvas');
        this.ctx = canvas.getContext("2d");

        this.repaint();
    }

    connectedCallback() {
        super.connectedCallback();
        InputControl.addEventListener('change', this.onInputChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        InputControl.removeEventListener('change', this.onInputChange);
    }

    onInputChange(evt) {
        if (evt.detail.player !== this.player) return;

        this.inTransition = false;
        this.state = evt.detail.state;
        this.repaint();
    }

    toggleConnect() {
        if (this.inTransition) return;
        console.log('Toggle connection for ', this.player);
        this.inTransition = true;
        InputControl.toggleThingy52(this.player, this.color);
        this.repaint();
    }

    repaint() {
        if (!this.ctx) return;

        if (this.inTransition) {
            this.ctx.fillStyle = '#808080';
        } else if (this.state === 'connected') {
            this.ctx.fillStyle = this.color;
        } else {
            this.ctx.fillStyle = '#ffffff';
        }

        this.ctx.fillRect(0,0,70,70);

        this.ctx.fillStyle = '#000000';

        this.ctx.beginPath();
        this.ctx.arc(10, 10, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }

}
customElements.define('connect-button', ConnectButton);