// SPDX-License-Identifier: MIT
// Copyright (c) 2022-2023 The Pybricks Authors

import { Toast } from '@blueprintjs/core';
import React from 'react';
import { testRender } from '../../../test';
import { noWebUsb } from './NoWebUsb';

it('should dismiss when close is clicked', async () => {
    const callback = jest.fn();
    const toast = noWebUsb(callback, undefined as never);

    const [user, message] = testRender(<Toast {...toast} />);

    await user.click(message.getByRole('button', { name: /close/i }));

    expect(callback).toHaveBeenCalledWith('dismiss');
});