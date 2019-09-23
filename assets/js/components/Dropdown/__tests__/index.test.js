import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { spy } from 'sinon';

import Dropdown from '../';

describe('<Dropdown />', () => {

  it('throws if the required prop of `values` is not provided', () => {
    expect(() => render(<Dropdown />)).to.throw(`Cannot read property 'map' of undefined`);
  });

  it('it starts with "Select something" if no default value (`defaultValueId`) (and no `defaultLabel`)', () => {
    const { getByText } = render(<Dropdown values={[]} />);
    expect(() => getByText('Select something')).to.not.throw();
  });

  it('it starts with default value selected', () => {
    const values = [{ id: 'foo', label: 'foo' }, { id: 'bar', label: 'bar' }];

    const selectedValue = values[0];
    const aNonSelectedValue = values[1];
    const { getAllByText, getByText } = render(<Dropdown values={values} defaultValueId={selectedValue.id} />);

    expect(() => getByText('Select something')).to.throw();
    expect(getAllByText(selectedValue.label)).to.have.lengthOf(2);
    expect(getAllByText(aNonSelectedValue.label)).to.have.lengthOf(1);
  });

  it('gives correct value on valueChange handler', () => {
    const handleValueChangeSpy = spy();
    const values = [{ id: 'foo', label: 'foo' }, { id: 'bar', label: 'bar' }];

    const valueToSelect = values[0];
    const { getByText } = render(<Dropdown values={values} onValueChange={handleValueChangeSpy} />);

    fireEvent.click(getByText(valueToSelect.label));

    expect(handleValueChangeSpy).to.have.been.calledOnceWith(valueToSelect);
  });
});
