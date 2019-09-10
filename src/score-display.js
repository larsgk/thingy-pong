import {LitElement, html, css} from 'lit-element';

export class ScoreDisplay extends LitElement {
    constructor() {
        super();

        this.score = 0;
    }

    static get properties() {
        return {
            score: { type: Number }
        }
    }

    static get styles() {
        return [css`
            .score {
                display: flex;
                height: 100%;
                width: 150px;
                color: white;
                font-family: Roboto, sans-serif;
                font-size: 40px;
                align-items: center;
                justify-content: center;

            }

            `
        ]
    }

    render() {
        return html`
            <div class="score">${`${this.score}`.padStart(3, '0')}</div>
        `;
    }
}
customElements.define('score-display', ScoreDisplay);