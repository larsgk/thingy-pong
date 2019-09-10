// @ts-check
import { LitElement, html, css } from 'lit-element';

import { InputControl } from './input-control';

import './score-display';
import './connect-button';
import './game-canvas';

export class MainApp extends LitElement {
    static get properties() {
        return {
            leftScore: { type: Number },
            rightScore: { type: Number }
        };
    }

    static get styles() {
        return [
            css`
            :host {
                margin: 0;
                padding: 0;
                font-family: Roboto, sans-serif;
                color: white;
            }
            .main {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            .gamearea {
                display: flex;
                flex-direction: column;
                width: calc(100vmin - 10px);
                height: calc(100vmin - 10px);
                background: black;
                box-sizing: border-box;
                /* border: 2px solid white; */
            }

            .controls {
                display: flex;
                flex-direction: row;
                height: 80px;
                background: black;
                font-size: 40px;
            }

            .fill {
                flex-grow: 1;
            }

            .game {
                flex-grow: 1;
                background: black;
                border-color: #808080;
                border-style: solid;
                border-width: 4px 0 4px 0;
                box-sizing: border-box;
            }

            h1 {
                text-align: center;
            }

            button {
                flex-grow: 1;
                font-size: 1.2rem;
                margin: 0.2em;
            }
        `];
    }

    constructor() {
        super();

        this.clearScore();

    }

    onGoal(evt) {
        if (evt.detail === 'left') {
            this.rightScore++;
        } else if(evt.detail === 'right') {
            this.leftScore++;
        }
    }

    clearScore() {
        this.leftScore = 0;
        this.rightScore = 0;
    }

    render() {
        return html`
            <div class="main">
                <div class="gamearea">
                    <div class="controls">
                        <score-display .score=${this.leftScore}></score-display>
                        <connect-button player="left" color="#FF0000"></connect-button>
                        <div class="fill"></div>
                        <connect-button player="right" color="#0000FF"></connect-button>
                        <score-display .score=${this.rightScore}></score-display>
                    </div>
                    <game-canvas class="game" @goal=${this.onGoal}></game-canvas>
                </div>
            </div>
        `;
    }

    firstUpdated() {
        InputControl.initialize();
    }
}
customElements.define("main-app", MainApp);
