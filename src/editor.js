import { LitElement, html, css } from 'lit-element';
import { DEFAULT_SHOW } from './const';

const text = () => ({ text: {} });
const number = step => ({ number: { mode: 'box', step } });
const select = options => ({ select: { options } });
const field = (name, selector) => ({ name, selector });

const cardSchema = [
  field('name', text()),
  field('icon', text()),
  field('unit', text()),
  field('hours_to_show', number(1)),
];

const advancedCardSchema = [
  field('decimals', number(1)),
  field('height', number(1)),
  field('lower_bound', text()),
  field('upper_bound', text()),
  field('points_per_hour', number(0.1)),
];

const showSchema = [
  field('graph', select([
    { value: 'line', label: 'Line' },
    { value: 'bar', label: 'Bar' },
    { value: false, label: 'Hidden' },
  ])),
  field('state', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
    { value: 'last', label: 'Last graph value' },
  ])),
];

const advancedShowSchema = [
  field('labels', select([
    { value: true, label: 'Always show' },
    { value: false, label: 'Hide' },
    { value: 'hover', label: 'On hover' },
  ])),
  field('labels_secondary', select([
    { value: true, label: 'Always show' },
    { value: false, label: 'Hide' },
    { value: 'hover', label: 'On hover' },
  ])),
  field('points', select([
    { value: true, label: 'Always show' },
    { value: false, label: 'Hide' },
    { value: 'hover', label: 'On hover' },
  ])),
  field('name', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('icon', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('fill', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
    { value: 'fade', label: 'Fade' },
  ])),
];

const entitySchema = [
  field('entity', {
    entity: { include_domains: ['sensor', 'binary_sensor', 'climate', 'switch', 'sun'] },
  }),
  field('name', text()),
  field('color', text()),
];

const advancedEntitySchema = [
  field('attribute', text()),
  field('points_per_hour', number(0.1)),
  field('show_legend', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('show_fill', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('show_line', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('show_points', select([
    { value: true, label: 'Show' },
    { value: false, label: 'Hide' },
  ])),
  field('y_axis', select(['primary', 'secondary'])),
];

const defaultEntityOptions = {
  show_legend: true,
  show_fill: true,
  show_line: true,
  show_points: true,
  y_axis: 'primary',
};

const label = schema => schema.label || schema.name.replace(/_/g, ' ');

class MiniGraphCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _newEntity: String,
    };
  }

  static get styles() {
    return css`
      .section {
        margin: 16px 0;
      }

      h3 {
        margin: 0 0 8px;
      }

      .row {
        border-bottom: 1px solid var(--divider-color);
        padding: 8px 0;
      }

      .row-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      details.section,
      details.entity-options {
        border-top: 1px solid var(--divider-color);
        padding-top: 12px;
      }

      details.entity-options {
        margin-top: 8px;
      }

      summary {
        cursor: pointer;
        font-weight: 500;
        padding: 4px 0;
      }

      button {
        background: none;
        border: 0;
        color: var(--primary-color);
        cursor: pointer;
      }
    `;
  }

  constructor() {
    super();
    this._config = { entities: [] };
    this._newEntity = '';
    this._cardChanged = this._cardChanged.bind(this);
    this._showChanged = this._showChanged.bind(this);
    this._newEntityChanged = this._newEntityChanged.bind(this);
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
  }

  render() {
    const config = this._config || { entities: [] };
    return html`
      <div class="section">
        <h3>Card</h3>
        <ha-form
          .hass=${this.hass}
          .data=${config}
          .schema=${cardSchema}
          .computeLabel=${label}
          @value-changed=${this._cardChanged}
        ></ha-form>
      </div>

      <div class="section">
        <h3>Graph</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._getShowFormData()}
          .schema=${showSchema}
          .computeLabel=${label}
          @value-changed=${this._showChanged}
        ></ha-form>
      </div>

      <div class="section">
        <h3>Entities</h3>
        ${(config.entities || []).map((entity, index) => html`
          <div class="row">
            <div class="row-header">
              <strong>${typeof entity === 'string' ? entity : entity.entity || `Entity ${index + 1}`}</strong>
              <button @click=${() => this._removeEntity(index)}>Remove</button>
            </div>
            <ha-form
              .hass=${this.hass}
              .data=${typeof entity === 'string' ? { entity } : entity}
              .schema=${entitySchema}
              .computeLabel=${label}
              @value-changed=${event => this._entityChanged(index, event)}
            ></ha-form>
            <details class="entity-options">
              <summary>More entity options</summary>
              <ha-form
                .hass=${this.hass}
                .data=${this._getEntityFormData(entity)}
                .schema=${advancedEntitySchema}
                .computeLabel=${label}
                @value-changed=${event => this._entityChanged(index, event)}
              ></ha-form>
            </details>
          </div>
        `)}
        <label>
          Add entity
          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._newEntity}
            .includeDomains=${['sensor', 'binary_sensor', 'climate', 'switch', 'sun']}
            @value-changed=${this._newEntityChanged}
          ></ha-entity-picker>
        </label>
      </div>

      <details class="section">
        <summary>More options</summary>
        <h3>Graph options</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._getShowFormData()}
          .schema=${advancedShowSchema}
          .computeLabel=${label}
          @value-changed=${this._showChanged}
        ></ha-form>
        <ha-form
          .hass=${this.hass}
          .data=${config}
          .schema=${advancedCardSchema}
          .computeLabel=${label}
          @value-changed=${this._cardChanged}
        ></ha-form>
        ${this._renderList('Color thresholds', 'color_thresholds', [
    field('value', number(0.1)),
    field('color', text()),
  ])}
        ${this._renderList('State map', 'state_map', [
    field('value', text()),
    field('label', text()),
  ])}
      </details>
    `;
  }

  _renderList(title, key, schema) {
    const items = this._config[key] || [];
    return html`
      <div class="section">
        <h3>${title}</h3>
        ${items.map((item, index) => html`
          <div class="row">
            <div class="row-header">
              <strong>${title} ${index + 1}</strong>
              <button @click=${() => this._removeListItem(key, index)}>Remove</button>
            </div>
            <ha-form
              .hass=${this.hass}
              .data=${typeof item === 'string' ? { value: item, label: item } : item}
              .schema=${schema}
              .computeLabel=${label}
              @value-changed=${event => this._listItemChanged(key, index, event)}
            ></ha-form>
          </div>
        `)}
        <button @click=${() => this._addListItem(key)}>Add</button>
      </div>
    `;
  }

  _cardChanged(event) {
    this._updateConfig(event.detail.value);
  }

  _showChanged(event) {
    const show = { ...this._config.show, ...event.detail.value };
    Object.keys(DEFAULT_SHOW).forEach((key) => {
      if (show[key] === DEFAULT_SHOW[key]) delete show[key];
    });
    this._updateConfig({ show });
  }

  _getShowFormData() {
    return { ...DEFAULT_SHOW, ...this._config.show };
  }

  _entityChanged(index, event) {
    const entities = [...(this._config.entities || [])];
    const original = typeof entities[index] === 'string'
      ? { entity: entities[index] }
      : entities[index];
    const updated = { ...original, ...event.detail.value };
    Object.keys(defaultEntityOptions).forEach((key) => {
      if (original[key] === undefined && updated[key] === defaultEntityOptions[key]) {
        delete updated[key];
      }
    });
    entities[index] = updated;
    this._updateConfig({ entities });
  }

  _getEntityFormData(entity) {
    const entityConfig = typeof entity === 'string' ? { entity } : entity;
    return { ...defaultEntityOptions, ...entityConfig };
  }

  _listItemChanged(key, index, event) {
    const items = [...(this._config[key] || [])];
    const current = typeof items[index] === 'string'
      ? { value: items[index], label: items[index] }
      : items[index];
    items[index] = { ...current, ...event.detail.value };
    this._updateConfig({ [key]: items });
  }

  _newEntityChanged(event) {
    const entity = event.detail.value;
    this._newEntity = '';
    if (entity) {
      this._updateConfig({ entities: [...(this._config.entities || []), { entity }] });
    }
  }

  _removeEntity(index) {
    this._updateConfig({
      entities: this._config.entities.filter((_, entityIndex) => entityIndex !== index),
    });
  }

  _addListItem(key) {
    const item = key === 'color_thresholds' ? { value: 0, color: '' } : { value: '', label: '' };
    this._updateConfig({ [key]: [...(this._config[key] || []), item] });
  }

  _removeListItem(key, index) {
    this._updateConfig({
      [key]: this._config[key].filter((_, itemIndex) => itemIndex !== index),
    });
  }

  _updateConfig(changes) {
    this._config = { ...this._config, ...changes };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('mini-graph-card-editor', MiniGraphCardEditor);
