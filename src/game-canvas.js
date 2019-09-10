// @ts-check

import {LitElement, html, css} from 'lit-element';

import { InputControl } from './input-control';

export class GameCanvas extends LitElement {
    constructor() {
        super();

        this.batDist = 0.04; // fraction from wall

        this.goals = {
            left: -1 + (this.batDist * 0.5),
            right: 1 - (this.batDist * 0.5)
        }

        this.right = 1;
        this.bottom = 1;

        this.repaint = this.repaint.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.newVelocity = this.newVelocity.bind(this);

        this.newGame();
    }

    static get properties() {
        return {
        }
    }

    static get styles() {
        return [css`
            :host {
                display: block;
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            div {
                height: inherit;
            }
            canvas {
                display: block;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }

            `
        ]
    }

    newGame() {
        this.bats = {
            left: {
                pos: 0,
                velocity: 0,
                big: false
            },
            right: {
                pos: 0,
                velocity: 0,
                big: false
            }
        }
    }

    resetBall() {
        // Random angle
        const angle = 0.2 + Math.random();
        const vx = Math.random() < 0.5 ? Math.cos(angle) : -Math.cos(angle);
        const vy = Math.random() < 0.5 ? Math.sin(angle) : -Math.sin(angle);

        console.log(vx,vy);

        this.ball = {
            pos: {
                x: 0,
                y: 0
            },
            velocity: {
                x: 0.5 * vx,
                y: 0.5 * vy
            }
        }
    }

    render() {
        return html`
            <div>
                <canvas></canvas>
            </div>
        `;
    }

    set state(val) {
        if (this._state === val) return;

        this._state = val;

        if (val === 'next') {
            this.resetBall();
            setTimeout(() => {this.state = 'running'}, 2000);
        } if (val === 'running') {
        }
    }

    gameLoop(ts) {
        requestAnimationFrame(this.gameLoop);

        if (this.prevts) {
            const dt = (ts - this.prevts) * 0.001;

            if (this._state === 'running') {
                // calc new ball pos
                let ballx = this.ball.pos.x + this.ball.velocity.x * dt;
                let bally = this.ball.pos.y + this.ball.velocity.y * dt;

                if (bally < -0.99 || bally > 0.99) {
                    this.ball.velocity.y *= -1;
                    bally = this.ball.pos.y + this.ball.velocity.y * dt;
                }

                this.ball.pos.x = ballx;
                this.ball.pos.y = bally;

                // check for goal
                if (ballx < this.goals.left) {
                    this.dispatchEvent(new CustomEvent('goal', {detail: 'left'}));
                    this.state = 'next';
                } else if(ballx > this.goals.right) {
                    this.dispatchEvent(new CustomEvent('goal', {detail: 'right'}));
                    this.state = 'next';
                }

                // check for bats
                if (ballx <= (this.batDist-1)) {
                    if (Math.abs(bally - this.bats.left.pos) < 0.1) {
                        this.ball.velocity.x *= -1.1;
                        this.ball.velocity.y *= 1.1;
                        ballx = this.ball.pos.x + this.ball.velocity.x * dt;
                    }
                } else if (ballx >= (1-this.batDist)) {
                    if (Math.abs(bally - this.bats.right.pos) < 0.1) {
                        this.ball.velocity.x *= -1.1;
                        this.ball.velocity.y *= 1.1;
                        ballx = this.ball.pos.x + this.ball.velocity.x * dt;
                    }
                }

            }

            // calc new bat positions
            this.updateBat(dt, this.bats.left);
            this.updateBat(dt, this.bats.right);

        }

        this.prevts = ts;

        this.repaint();
    }

    updateBat(dt, bat) {
        bat.pos = Math.max(-1, Math.min(1, bat.pos + bat.velocity * dt));
    }

    onResize() {
        const cr = this.canvas.getBoundingClientRect();

        this.right = cr.width-1;
        this.bottom = cr.height-1;

        this.canvas.width = cr.width;
        this.canvas.height = cr.height;

        requestAnimationFrame(this.repaint);
    }

    firstUpdated() {
        /** @type {HTMLCanvasElement} */
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.ctx = this.canvas.getContext("2d");

        const ro = new ResizeObserver( entries => {
            this.onResize(); // we only listen on canvas
        });
        ro.observe(this.canvas);

        this.onResize();

        requestAnimationFrame(this.gameLoop);

        this.state = 'next';
    }

    connectedCallback() {
        super.connectedCallback();
        InputControl.addEventListener('velocity-change', this.newVelocity);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        InputControl.removeEventListener('velocity-change', this.newVelocity);
    }

    newVelocity(evt) {
        const player = evt.detail.player;
        const value = evt.detail.value;

        if (player === 'left') {
            this.bats.left.velocity = value;
        } else if (player === 'right') {
            this.bats.right.velocity = value;
        }
    }

    // onInputChange(evt) {
    //     if (evt.detail.player !== this.player) return;

    //     this.inTransition = false;
    //     this.state = evt.detail.state;
    //     this.repaint();
    // }

    repaint() {
        if (!this.ctx) return;
        const cy = this.bottom * 0.5;
        const cx = this.right * 0.5;

        this.ctx.clearRect(0,0,this.right+1,this.bottom+1);

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx,0);
        this.ctx.lineTo(cx, this.bottom);
        this.ctx.stroke();

        this.ctx.lineWidth = 5;

        // draw pads
        // left
        let dy = cy * (this.bats.left.big ? 0.2 : 0.1);
        let ypos = cy + (this.bats.left.pos * cy);
        let xpos = this.batDist * cx;
        this.ctx.beginPath();
        this.ctx.moveTo(xpos, ypos - dy);
        this.ctx.lineTo(xpos, ypos + dy);
        this.ctx.stroke();

        // right
        dy = cy * (this.bats.right.big ? 0.2 : 0.1);
        ypos = cy + (this.bats.right.pos * cy);
        xpos = this.right - (this.batDist * cx);
        this.ctx.beginPath();
        this.ctx.moveTo(xpos, ypos - dy);
        this.ctx.lineTo(xpos, ypos + dy);
        this.ctx.stroke();

        // draw ball
        xpos = cx + (this.ball.pos.x * cx);
        ypos = cy + (this.ball.pos.y * cy);
        this.ctx.fillRect(xpos-8, ypos-8, 16, 16);
    }

}
customElements.define('game-canvas', GameCanvas);