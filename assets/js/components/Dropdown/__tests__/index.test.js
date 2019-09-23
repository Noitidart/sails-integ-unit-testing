import React from 'react';
import { render } from '@testing-library/react'

import Dropdown from '../';

describe('<Dropdown />', () => {
  it('has text that says "hi"', () => {
    const { getByText, getAllByText } = render(<Dropdown />);

    expect(() => getByText('hi')).to.not.throw();
    expect(getAllByText('1')).to.have.lengthOf(2);

  });
});
