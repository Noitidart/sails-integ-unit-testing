import React, { useState } from 'react';

/**
 * @typedef {Object<string, any>} Value
 * @property {string} Value.label
 * @property {any} Value.id
 */

/**
 * @typedef {Object<string, any>} Props
 *
 * @param {Value[]} values
 * @param {Value["id"]} [defaultValueId] - start with this value selected
 * @param {Value => void} [onValueChange]
 * @param {string} [labelPrefix] - (default: "") show a prefix before Value["label"] when selected.
 * @param {string} [defaultLabel] - (default: "Select something") label to show if nothing selected.
 */

/**
 * @extends {React.FunctionalComponent<Props>}
 */
function Dropdown({
  values,
  defaultValueId,
  onValueChange,
  labelPrefix,
  defaultLabel
}) {

  const [selectedValue, setSelectedValue] = useState(defaultValueId ? values.find(value => value.id === defaultValueId) : null);

  const getHandleClick = value => e => {
    e.preventDefault();
    setSelectedValue(value);
    onValueChange(value);
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {!selectedValue
          ? (defaultLabel || 'Select something')
          : `${labelPrefix ? labelPrefix + ' ' : ''}${selectedValue.label}`
        }
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {values.map(value => (
          <a className="dropdown-item" href="#" onClick={getHandleClick(value)} key={value.id}>
            {value.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default Dropdown;
